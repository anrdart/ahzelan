"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, X, Upload, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type MediaItem = { id: string; file_name: string; file_url: string; mime_type?: string };

export default function MediaPicker({
  value,
  valueUrl,
  onChange,
  label,
}: {
  value: string | null;
  valueUrl?: string | null;
  onChange: (id: string | null, url: string | null) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchMedia = async (ignoreRef?: { current: boolean }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media?limit=100");
      if (res.ok && !ignoreRef?.current) {
        const data = (await res.json()) as MediaItem[];
        setItems(data);
      }
    } catch { /* ignore */ }
    if (!ignoreRef?.current) setLoading(false);
  };

  useEffect(() => {
    if (!open) return;
    const ignore = { current: false };
    fetchMedia(ignore);
    return () => { ignore.current = true; };
  }, [open]);

  const filtered = items.filter((m) =>
    !q || m.file_name.toLowerCase().includes(q.toLowerCase()),
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/admin/media", { method: "PUT", body: fd });
      if (!up.ok) throw new Error("Upload gagal");
      const { file_name, url, mime_type, size } = (await up.json()) as {
        file_name: string; url: string; mime_type: string; size: number;
      };
      const save = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name, file_url: url, mime_type, size }),
      });
      if (!save.ok) throw new Error("Save gagal");
      const saved = (await save.json()) as MediaItem;
      setItems((prev) => [saved, ...prev]);
      onChange(saved.id, saved.file_url);
      setOpen(false);
      toast.success("Media diupload");
    } catch (err: any) {
      toast.error(err.message);
    }
    setUploading(false);
  };

  const selectedUrl = valueUrl || items.find((m) => m.id === value)?.file_url;

  return (
    <div>
      {label && <label className="text-sm font-medium mb-1.5 block">{label}</label>}
      <div className="flex items-center gap-3">
        {value && selectedUrl ? (
          <div className="relative group">
            <img
              src={selectedUrl}
              alt=""
              className="w-16 h-16 rounded-lg object-cover border border-border"
            />
            <button
              type="button"
              onClick={() => onChange(null, null)}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
            <ImageIcon size={20} />
          </div>
        )}
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          {value ? "Ganti" : "Pilih Media"}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Pilih Media</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari file..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="button" variant="outline" size="sm" asChild className="relative">
              <label>
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Upload
                <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} disabled={uploading} />
              </label>
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Belum ada media.</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {filtered.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { onChange(m.id, m.file_url); setOpen(false); }}
                    className={cn(
                      "aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-primary",
                      m.id === value ? "border-primary ring-2 ring-primary/20" : "border-border",
                    )}
                  >
                    <img src={m.file_url} alt={m.file_name} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
