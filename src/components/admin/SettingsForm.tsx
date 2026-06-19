"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

type Settings = {
  site_name: string;
  tagline: string;
  whatsapp_number: string;
  email: string;
  footer_text: string;
  default_seo_title: string;
  default_seo_description: string;
  analytics_script: string;
  socials: { instagram?: string; youtube?: string; facebook?: string; twitter?: string; telegram?: string };
};

export default function SettingsForm({ initial }: { initial: Partial<Settings> }) {
  const [s, setS] = useState<Partial<Settings>>({
    site_name: "Ahzelan",
    tagline: "",
    whatsapp_number: "6285156563313",
    email: "salam@ahzelan.com",
    footer_text: "",
    default_seo_title: "",
    default_seo_description: "",
    analytics_script: "",
    socials: {},
    ...initial,
  });
  const [busy, setBusy] = useState(false);

  const set = (k: keyof Settings, v: any) => setS((p) => ({ ...p, [k]: v }));
  const setSocial = (k: keyof NonNullable<Settings["socials"]>, v: string) => setS((p) => ({ ...p, socials: { ...(p.socials ?? {}), [k]: v } }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error || "Gagal");
      toast.success("Pengaturan tersimpan");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="bg-card border border-border rounded-2xl p-6 max-w-3xl space-y-5">
      <div>
        <h2 className="font-display font-bold text-lg mb-3">Umum</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Nama situs</Label>
            <Input className="mt-1.5" value={s.site_name ?? ""} onChange={(e) => set("site_name", e.target.value)} />
          </div>
          <div>
            <Label>Tagline</Label>
            <Input className="mt-1.5" value={s.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} />
          </div>
        </div>
      </div>
      <Separator />
      <div>
        <h2 className="font-display font-bold text-lg mb-3">Kontak</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>WhatsApp</Label>
            <Input className="mt-1.5" value={s.whatsapp_number ?? ""} onChange={(e) => set("whatsapp_number", e.target.value)} placeholder="628xxx" />
          </div>
          <div>
            <Label>Email</Label>
            <Input className="mt-1.5" type="email" value={s.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </div>
        </div>
      </div>
      <Separator />
      <div>
        <h2 className="font-display font-bold text-lg mb-3">Sosial</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {(["instagram", "youtube", "facebook", "twitter", "telegram"] as const).map((k) => (
            <div key={k}>
              <Label className="capitalize">{k}</Label>
              <Input className="mt-1.5" value={s.socials?.[k] ?? ""} onChange={(e) => setSocial(k, e.target.value)} placeholder="https://" />
            </div>
          ))}
        </div>
      </div>
      <Separator />
      <div>
        <h2 className="font-display font-bold text-lg mb-3">SEO</h2>
        <div className="space-y-4">
          <div>
            <Label>Default SEO Title</Label>
            <Input className="mt-1.5" value={s.default_seo_title ?? ""} onChange={(e) => set("default_seo_title", e.target.value)} />
          </div>
          <div>
            <Label>Default SEO Description</Label>
            <Textarea className="mt-1.5" rows={2} value={s.default_seo_description ?? ""} onChange={(e) => set("default_seo_description", e.target.value)} />
          </div>
        </div>
      </div>
      <Separator />
      <div>
        <h2 className="font-display font-bold text-lg mb-3">Footer & Analytics</h2>
        <div className="space-y-4">
          <div>
            <Label>Footer text</Label>
            <Textarea className="mt-1.5" rows={2} value={s.footer_text ?? ""} onChange={(e) => set("footer_text", e.target.value)} />
          </div>
          <div>
            <Label>Analytics script (HTML/JS)</Label>
            <Textarea className="mt-1.5 font-mono text-[12px]" rows={4} value={s.analytics_script ?? ""} onChange={(e) => set("analytics_script", e.target.value)} placeholder="<!-- tag -->" />
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-3 border-t border-border">
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Simpan Pengaturan
        </Button>
      </div>
    </form>
  );
}
