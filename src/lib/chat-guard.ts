/**
 * Input guardrails for the live-chat bot.
 *
 * Goals:
 *  1. Stop jailbreak / prompt-injection ("ignore previous instructions", role-play
 *     escape, "you are now DAN", reveal-the-prompt, etc.) before they hit the LLM.
 *  2. Cap message length so a single guest can't blow the token budget.
 *  3. Rate-limit per guest token + per IP so spam/loops can't drain credits.
 *  4. Block obvious abuse (PII harvesting requests, code/credential exfil, etc.).
 *
 * Everything here is stateless except the in-memory rate-limit map (good enough
 * for a single Worker instance; for multi-instance, move to KV/Durable Object).
 */

export const MAX_MESSAGE_CHARS = 500;
export const MAX_MESSAGES_PER_WINDOW = 20; // per guest per window
export const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const MAX_MESSAGES_TOTAL = 60; // lifetime cap per guest session

/** Patterns that strongly indicate a prompt-injection / jailbreak attempt. */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all |any |the )?(previous |prior |above |earlier )?instructions/i,
  /disregard (all |any |the )?(previous |prior |above )?(instructions|rules|prompts)/i,
  /forget (all |your )?(previous |prior )?(instructions|rules|prompts)/i,
  /you are (now )?(DAN|do anything now|developer mode|jailbroken|in ?test mode|a different ai|free of restrictions|unrestricted)/i,
  /act as (if you (are|were) )?(a (different )?ai|an? (ai )?(without|with no) (rules|restrictions|limits|filter))/i,
  /system prompt|show (me )?(your )?(instructions|prompt|rules)/i,
  /reveal (your|the) (system )?prompt/i,
  /what (are|is) your (system )?(instructions|prompt|rules)/i,
  /pretend (you (are|can)|to be)/i,
  /(enable|enter|activate|turn on) (developer |god )?mode/i,
  /\b(STAN|DUDE|AIM|KEVIN)\b/i, // well-known jailbreak personas
  /override (your |the )?(rules|restrictions|safety|filter)/i,
  /no longer (apply|follow|bound by)/i,
  /\[system\]|\[admin\]|\[assistant\]/i, // role-tag spoofing
  /<\/?(system|assistant|developer)>/i,
];

/** Topic red-lines: refuse + nudge back to services. */
const REDLINE_PATTERNS: RegExp[] = [
  /\b(hack|exploit|malware|ransomware|phishing script|sql injection|xss payload|ddos|botnet)\b/i,
  /\b(write|create|generate) (a |an )?(virus|keylogger|rat |remote access trojan|cheat|aimbot)/i,
  /\b(bomb|explosive|meth|cocaine|heroin|weapon|firearm|gun) (recipe|instructions|how to make|synthesis)\b/i,
  /\b(csam|child (sexual|abuse)|underage (nude|porn))\b/i,
  /\b(suicide|kill myself|end my life|self[- ]harm) (method|how to|ways to|guide)\b/i,
];

/** Cheap PII / secret harvesting attempts. */
const SECRET_PATTERNS: RegExp[] = [
  /\b(api[_ -]?key|secret[_ -]?key|access[_ -]?token|password|passwd)\b.{0,20}\??/i,
  /\b(give|tell|share|leak|exfil) (me )?(your|the) (api|secret|token|key|password|credentials)\b/i,
  /\bsk-[a-zA-Z0-9]{20,}\b/i, // OpenAI-style key
  /\b(AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}\b/i, // AWS
];

type Verdict = {
  allowed: boolean;
  reason?: "empty" | "too_long" | "injection" | "redline" | "secret" | "rate_limited" | "total_limited";
  message: string; // user-facing reply when blocked
};

/** Quick max-cost canned replies (Indonesian, brand voice). */
const REPLIES: Record<NonNullable<Verdict["reason"]>, string> = {
  empty: "Tulis pesannya dulu ya 😊",
  too_long: `Pesan kepanjangan 😅 Maksimal ${MAX_MESSAGE_CHARS} karakter. Bisa diperingkas?`,
  injection: "Aku tetap Ahzelan AI — nggak bisa diubah perannya 😉 Coba tanya soal layanan aja ya: landing page, website, copywriting, atau ads.",
  redline: "Maaf, itu di luar layanan Ahzelan dan nggak bisa aku bantu. Tanya soal digital marketing, website, atau landing page aja ya 🙏",
  secret: "Aku nggak punya akses ke kunci/rahasia apa pun, dan nggak akan minta data sensitif kamu. Kalau butuh bantuan layanan, tanya aja ya.",
  rate_limited: "Santai, kamu nanya terlalu cepat nih 🙏 Tunggu sebentar ya, nanti bisa lanjut lagi.",
  total_limited: "Wah, obrolan kita udah lumayan panjang 😅 Biar fokus, lanjut via WhatsApp aja ya: wa.me/6285156563313. Atau klik 'Minta Live Chat'.",
};

// ---- Rate limiting (in-memory, per Worker isolate) ---------------------------
type Counter = { count: number; windowCount: number; windowStart: number };
const counters = new Map<string, Counter>();

function bumpCounter(token: string): { windowCount: number; total: number } {
  const now = Date.now();
  let c = counters.get(token);
  if (!c) {
    c = { count: 0, windowCount: 0, windowStart: now };
    counters.set(token, c);
  }
  if (now - c.windowStart > RATE_WINDOW_MS) {
    c.windowStart = now;
    c.windowCount = 0;
  }
  c.windowCount += 1;
  c.count += 1;
  return { windowCount: c.windowCount, total: c.count };
}

// Lightweight periodic GC so the map can't grow unbounded.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const cutoff = Date.now() - RATE_WINDOW_MS * 2;
    for (const [k, v] of counters) if (v.windowStart < cutoff) counters.delete(k);
  }, RATE_WINDOW_MS).unref?.();
}

/**
 * Validate a guest message before it reaches the LLM. Mutates rate state.
 * Returns { allowed, message } — when blocked, `message` is the canned reply
 * the API should store + return instead of calling the model.
 */
export function guardGuestMessage(token: string, raw: string): Verdict {
  const text = (raw ?? "").trim();
  if (!text) return { allowed: false, reason: "empty", message: REPLIES.empty };
  if (text.length > MAX_MESSAGE_CHARS) return { allowed: false, reason: "too_long", message: REPLIES.too_long };

  if (INJECTION_PATTERNS.some((re) => re.test(text))) return { allowed: false, reason: "injection", message: REPLIES.injection };
  if (REDLINE_PATTERNS.some((re) => re.test(text))) return { allowed: false, reason: "redline", message: REPLIES.redline };
  if (SECRET_PATTERNS.some((re) => re.test(text))) return { allowed: false, reason: "secret", message: REPLIES.secret };

  const { windowCount, total } = bumpCounter(token);
  if (total > MAX_MESSAGES_TOTAL) return { allowed: false, reason: "total_limited", message: REPLIES.total_limited };
  if (windowCount > MAX_MESSAGES_PER_WINDOW) return { allowed: false, reason: "rate_limited", message: REPLIES.rate_limited };

  return { allowed: true, message: "" };
}
