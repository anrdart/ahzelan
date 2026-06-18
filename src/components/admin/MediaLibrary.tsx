"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";
import { Upload, Copy, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "./ConfirmDialog";

type MediaItem = { id: string; file_name: string; file_url: string; alt_text?: string; size?: number };

export default function MediaLibrary({ initial, canUpload }: { initial: MediaItem[]; canUpload: boolean }) {
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [sel, setSel] = useState<number>(initial.length ? 0 : -1);
  const [uploading, setUploading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!canUpload) {
      toast.error("Set Supabase env dulu buat upload");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
      if (!up.ok) throw new Error(((await up.json().catch(() => ({}))) as { error?: string }).error || "Upload gagal");
      const meta = (await up.json()) as { file_name: string; url: string; mime_type: string; size: number };
      const rec = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: meta.file_name, file_url: meta.url, mime_type: meta.mime_type, size: meta.size }),
      });
      const row = (await rec.json()) as MediaItem;
      setItems((it) => [row, ...it]);
      setSel(0);
      toast.success("Media terupload");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL disalin");
  };

  const current = sel >= 0 ? items[sel] : null;

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-6">
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-surface-page flex flex-col items-center justify-center gap-2 text-muted-foreground font-display font-semibold text-[13px] hover:border-royal-300 hover:text-royal-600 transition-colors"
          >
            {uploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
            {uploading ? "Mengupload…" : "Upload"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          {items.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setSel(i)}
              className="aspect-square rounded-2xl overflow-hidden bg-muted flex items-center justify-center relative"
              style={{ border: "3px solid " + (sel === i ? "var(--brand-primary)" : "transparent") }}
            >
              {m.file_url ? (
                <img src={m.file_url} alt={m.alt_text ?? m.file_name} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <Icon name="image" size={28} className="text-royal-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-5 self-start">
        {current ? (
          <>
            <div className="aspect-video rounded-xl overflow-hidden bg-muted flex items-center justify-center mb-4">
              {current.file_url ? <img src={current.file_url} alt="" className="w-full h-full object-cover" /> : <Icon name="image" size={36} className="text-royal-500" />}
            </div>
            <div className="font-display font-bold text-[15px] mb-1 break-all">{current.file_name}</div>
            <div className="text-[13px] text-muted-foreground mb-4">{current.size ? `${Math.round(current.size / 1024)} KB` : "—"}</div>
            <div className="mb-3.5">
              <Label htmlFor="alt">Alt text</Label>
              <Input id="alt" defaultValue={current.alt_text ?? ""} className="mt-1.5" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => copyUrl(current.file_url)}>
                <Copy size={15} /> Copy URL
              </Button>
              <button onClick={() => setConfirm(true)} aria-label="Hapus" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input text-rose-500 hover:bg-rose-50">
                <Trash2 size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm">Belum ada media. Upload yang pertama.</div>
        )}
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Hapus media ini?"
        description="File akan dihapus permanen dari library."
        onConfirm={async () => {
          if (!current) return;
          await fetch(`/api/admin/media?id=${current.id}`, { method: "DELETE" });
          setItems((it) => it.filter((x) => x.id !== current.id));
          setSel(0);
          setConfirm(false);
          toast.success("Media dihapus");
        }}
      />
    </div>
  );
}
