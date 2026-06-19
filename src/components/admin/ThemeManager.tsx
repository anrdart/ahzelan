"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Check, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PRIMARIES = [
  { name: "Royal", val: "#2e4191", hover: "#283878", soft: "#eef1fa" },
  { name: "Emerald", val: "#059669", hover: "#047857", soft: "#ecfdf5" },
  { name: "Blue", val: "#2563eb", hover: "#1d4ed8", soft: "#eff6ff" },
  { name: "Violet", val: "#7c3aed", hover: "#6d28d9", soft: "#f5f3ff" },
  { name: "Rose", val: "#e11d48", hover: "#be123c", soft: "#fff1f2" },
  { name: "Amber", val: "#d97706", hover: "#b45309", soft: "#fffbeb" },
];
const RADII = [
  { name: "Tegas", val: "6px" },
  { name: "Sedang", val: "12px" },
  { name: "Membulat", val: "20px" },
];
const FONTS = ["Plus Jakarta Sans", "Inter"];

export default function ThemeManager({ initial }: { initial?: { primary_color?: string; radius?: string } }) {
  const [primary, setPrimary] = useState(
    PRIMARIES.find((p) => p.val.toLowerCase() === (initial?.primary_color ?? "").toLowerCase()) ?? PRIMARIES[0],
  );
  const [radius, setRadius] = useState(RADII.find((r) => r.val === initial?.radius) ?? RADII[1]);
  const [font, setFont] = useState(FONTS[0]);
  const [dark, setDark] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primary_color: primary.val, font_heading: font, radius: radius.val }),
      });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error || "Gagal");
      toast.success("Tema tersimpan");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const previewVars: React.CSSProperties = {
    // @ts-expect-error css vars
    "--brand-primary": primary.val,
    "--brand-primary-soft": dark ? "rgba(255,255,255,.08)" : primary.soft,
  };
  const pBg = dark ? "#0f172a" : "#fff";
  const pFg = dark ? "#fff" : "#0f172a";
  const pMuted = dark ? "#94a3b8" : "#64748b";

  return (
    <div className="grid lg:grid-cols-[minmax(0,360px)_1fr] gap-6">
      {/* Controls */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="mb-5">
          <div className="font-display font-bold text-sm mb-2.5">Warna Primary</div>
          <div className="flex gap-2.5 flex-wrap">
            {PRIMARIES.map((p) => (
              <button
                key={p.name}
                onClick={() => setPrimary(p)}
                aria-label={p.name}
                className="w-10 h-10 rounded-xl shadow-sm transition-transform hover:scale-105"
                style={{ background: p.val, border: primary.val === p.val ? "3px solid #0f172a" : "3px solid transparent" }}
              />
            ))}
          </div>
          <div className="text-[13px] text-muted-foreground mt-2 font-mono">{primary.name} · {primary.val}</div>
        </div>
        <Separator />
        <div className="my-5">
          <div className="font-display font-bold text-sm mb-2.5">Sudut (Radius)</div>
          <div className="flex gap-2">
            {RADII.map((r) => (
              <button
                key={r.name}
                onClick={() => setRadius(r)}
                className="flex-1 py-2.5 rounded-lg font-display font-semibold text-[13.5px] transition-colors"
                style={{
                  border: "1px solid " + (radius.val === r.val ? primary.val : "var(--border)"),
                  background: radius.val === r.val ? primary.soft : "#fff",
                  color: radius.val === r.val ? primary.val : "var(--text-body)",
                }}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-5">
          <div className="font-display font-bold text-sm mb-2.5">Font Heading</div>
          <div className="flex flex-col gap-2">
            {FONTS.map((f) => (
              <button
                key={f}
                onClick={() => setFont(f)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg font-display font-semibold text-sm transition-colors"
                style={{
                  border: "1px solid " + (font === f ? primary.val : "var(--border)"),
                  background: font === f ? primary.soft : "#fff",
                }}
              >
                {f} {font === f && <Check size={16} style={{ color: primary.val }} />}
              </button>
            ))}
          </div>
        </div>
        <Separator />
        <div className="flex justify-between items-center my-5">
          <span className="font-display font-bold text-sm">Mode Gelap (preview)</span>
          <Switch checked={dark} onCheckedChange={setDark} />
        </div>
        <Button className="w-full" onClick={save} disabled={busy}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Simpan Tema
        </Button>
      </div>

      {/* Live preview */}
      <div className="rounded-2xl border border-border p-7 relative overflow-hidden" style={{ ...previewVars, background: dark ? "#020617" : "var(--surface-page)" }}>
        <Badge variant="neutral" className="absolute top-4 right-4">Live Preview</Badge>
        <div className="rounded-2xl p-7 shadow-md max-w-lg mx-auto mt-5" style={{ background: pBg, borderRadius: radius.val }}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[13px]" style={{ background: primary.soft, color: primary.val, fontFamily: font + ", sans-serif" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: primary.val }} /> Siap bantu kamu tumbuh
          </div>
          <h2 className="text-[28px] font-extrabold mt-4 mb-2 leading-tight" style={{ fontFamily: font + ", sans-serif", color: pFg }}>
            Bikin bisnis kamu tumbuh online
          </h2>
          <p className="text-[15px] leading-relaxed mb-5" style={{ color: pMuted }}>
            Landing page, website, dan copywriting yang fokus konversi — dikerjain santai.
          </p>
          <div className="flex gap-3 mb-6">
            <button className="inline-flex items-center gap-2 px-5 py-3 text-white font-semibold text-sm" style={{ background: primary.val, borderRadius: radius.val, fontFamily: font + ", sans-serif" }}>
              <MessageCircle size={16} /> Chat Ahzelan
            </button>
            <button className="px-5 py-3 font-semibold text-sm" style={{ background: "transparent", color: pFg, border: "1px solid " + (dark ? "#334155" : "var(--border)"), borderRadius: radius.val, fontFamily: font + ", sans-serif" }}>
              Lihat Layanan
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["Website", "Copywriting"].map((t) => (
              <div key={t} className="flex items-center gap-2.5 p-3.5" style={{ border: "1px solid " + (dark ? "#334155" : "var(--border)"), borderRadius: radius.val }}>
                <span className="w-8.5 h-8.5 rounded-lg flex items-center justify-center" style={{ width: 34, height: 34, background: primary.soft, color: primary.val }}>
                  <Check size={18} />
                </span>
                <span className="font-semibold text-sm" style={{ fontFamily: font + ", sans-serif", color: pFg }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
