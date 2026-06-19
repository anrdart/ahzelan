"use client";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { sanitizeHtml } from "@/lib/sanitize";
import DataTable from "./DataTable";
import ConfirmDialog from "./ConfirmDialog";
import RichTextEditor from "./RichTextEditor";
import MediaPicker from "./MediaPicker";

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  tags: string[] | null;
  status: "draft" | "published";
  published_at: string | null;
  featured_image_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function ArticleEditor({ initial }: { initial: Article[] }) {
  const [rows, setRows] = useState<Article[]>(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Article>>({});
  const [preview, setPreview] = useState<Article | null>(null);
  const [confirm, setConfirm] = useState<Article | null>(null);
  const [busy, setBusy] = useState(false);

  const startNew = () => {
    setEditing({ title: "", slug: "", excerpt: "", content: "", category: "Umum", tags: [], status: "draft", seo_title: "", seo_description: "" });
    setOpen(true);
  };
  const startEdit = (a: Article) => { setEditing({ ...a, tags: a.tags ?? [] }); setOpen(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...editing,
        slug: editing.slug?.trim() || slugify(editing.title ?? ""),
        published_at: editing.status === "published" ? (editing.published_at ?? new Date().toISOString()) : null,
      };
      const method = payload.id ? "PUT" : "POST";
      const res = await fetch("/api/admin/articles", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const parsed = (await res.json().catch(() => ({}))) as Article & { error?: string };
      if (!res.ok) throw new Error(parsed.error || "Gagal");
      const row = parsed;
      setRows((rs) => {
        const i = rs.findIndex((r) => r.id === row.id);
        if (i >= 0) { const cp = [...rs]; cp[i] = row; return cp; }
        return [row, ...rs];
      });
      setOpen(false);
      toast.success("Artikel tersimpan");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (a: Article) => {
    await fetch(`/api/admin/articles?id=${a.id}`, { method: "DELETE" });
    setRows((rs) => rs.filter((r) => r.id !== a.id));
  };

  const set = (k: keyof Article, v: any) => setEditing((s) => ({ ...s, [k]: v }));

  return (
    <>
      <DataTable
        title="Artikel"
        rows={rows}
        addLabel="Tulis Artikel"
        onAdd={startNew}
        onEdit={startEdit}
        onDelete={onDelete}
        onView={(r) => setPreview(r as Article)}
        searchKeys={["title", "category", "excerpt"] as any}
        columns={[
          { key: "title", label: "Judul", className: "font-display font-semibold" },
          { key: "category", label: "Kategori" },
          { key: "status", label: "Status" },
          { key: "published_at", label: "Tanggal", render: (r) => <span className="text-muted-foreground text-sm">{r.published_at ? new Date(r.published_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span> },
        ]}
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-5 flex-row items-center justify-between">
            <SheetTitle>{editing.id ? "Edit Artikel" : "Tulis Artikel"}</SheetTitle>
            <SheetClose className="rounded-sm opacity-70 hover:opacity-100"><X className="h-4 w-4" /></SheetClose>
          </SheetHeader>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label>Judul *</Label>
              <Input className="mt-1.5" value={editing.title ?? ""} onChange={(e) => { set("title", e.target.value); if (!editing.id) set("slug", slugify(e.target.value)); }} required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Slug</Label>
                <Input className="mt-1.5" value={editing.slug ?? ""} onChange={(e) => set("slug", e.target.value)} placeholder="otomatis dari judul" />
              </div>
              <div>
                <Label>Kategori</Label>
                <Input className="mt-1.5" value={editing.category ?? ""} onChange={(e) => set("category", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Excerpt</Label>
              <Textarea className="mt-1.5" rows={2} value={editing.excerpt ?? ""} onChange={(e) => set("excerpt", e.target.value)} />
            </div>
            <MediaPicker
              label="Featured Image"
              value={editing.featured_image_id ?? null}
              onChange={(id) => set("featured_image_id", id)}
            />
            <div>
              <Label>Konten</Label>
              <div className="mt-1.5">
                <RichTextEditor value={editing.content ?? ""} onChange={(html) => set("content", html)} />
              </div>
            </div>
            <div>
              <Label>Tags (pisahkan dengan koma)</Label>
              <Input className="mt-1.5" value={(editing.tags ?? []).join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>SEO Title</Label>
                <Input className="mt-1.5" value={editing.seo_title ?? ""} onChange={(e) => set("seo_title", e.target.value)} />
              </div>
              <div>
                <Label>SEO Description</Label>
                <Input className="mt-1.5" value={editing.seo_description ?? ""} onChange={(e) => set("seo_description", e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Status</Label>
                <p className="text-xs text-muted-foreground mt-1">Publish = tampil di situs. Draft = simpan dulu.</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={editing.status === "published" ? "success" : "neutral"} dot={editing.status === "published"}>{editing.status}</Badge>
                <Switch checked={editing.status === "published"} onCheckedChange={(v) => set("status", v ? "published" : "draft")} />
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-border">
              <Button type="submit" disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : null} {editing.id ? "Simpan" : "Terbitkan"}</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Preview */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-y-auto max-h-[85vh]">
          {preview && (
            <div className="p-8">
              <Badge variant="soft">{preview.category}</Badge>
              <h1 className="text-3xl font-extrabold mt-3 mb-3">{preview.title}</h1>
              {preview.excerpt && <p className="text-muted-foreground text-lg">{preview.excerpt}</p>}
              <div className="mt-6 ahz-prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(preview.content) }} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)} title="Hapus artikel ini?" onConfirm={async () => { if (confirm) await onDelete(confirm); setConfirm(null); }} />
    </>
  );
}
