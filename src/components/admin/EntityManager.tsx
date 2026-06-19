"use client";
import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { X } from "lucide-react";
import { toast } from "sonner";
import DataTable, { type Column } from "./DataTable";
import EntityForm, { type Field } from "./EntityForm";

type Row = { id: string; [k: string]: any };

export default function EntityManager<T extends Row>({
  title,
  rows: initial,
  columns,
  fields,
  endpoint,
  searchKeys,
  addLabel,
  sortable = false,
  nameKey = "title",
}: {
  title: string;
  rows: T[];
  columns: Column<T>[];
  fields: Field[];
  endpoint: string;
  searchKeys?: (keyof T)[];
  addLabel?: string;
  sortable?: boolean;
  nameKey?: string;
}) {
  const [rows, setRows] = useState<T[]>(initial);
  const [editing, setEditing] = useState<T | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch(endpoint, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as T[];
      setRows(data);
    }
  }, [endpoint]);

  const startNew = () => { setEditing(null); setOpen(true); };
  const startEdit = (r: T) => { setEditing(r); setOpen(true); };

  const onDelete = async (r: T) => {
    const res = await fetch(`${endpoint}?id=${r.id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((rs) => rs.filter((x) => x.id !== r.id));
    } else {
      toast.error("Gagal menghapus");
    }
  };

  const onBulkDelete = async (ids: string[]) => {
    const res = await fetch(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      setRows((rs) => rs.filter((x) => !ids.includes(x.id)));
      toast.success(`${ids.length} item dihapus`);
    }
  };

  const onClone = async (r: T) => {
    // Build the clone from the declared field config (the write schema) so we
    // don't POST read-only/joined columns the API would reject.
    const clone: Record<string, any> = {};
    for (const f of fields) clone[f.name] = (r as Record<string, any>)[f.name];
    const nk = nameKey as string;
    if (clone[nk]) clone[nk] = `${clone[nk]} (copy)`;
    else if (clone.name) clone.name = `${clone.name} (copy)`;
    else if (clone.label) clone.label = `${clone.label} (copy)`;
    if (clone.slug) clone.slug = `${clone.slug}-copy`;
    // Articles: reset publish state so the copy is a fresh draft.
    if ("status" in clone) clone.status = "draft";
    if ("published_at" in clone) clone.published_at = null;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clone),
    });
    if (res.ok) {
      const data = (await res.json()) as T;
      setRows((rs) => [data, ...rs]);
      toast.success("Berhasil diduplikat");
    } else {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(err.error || "Gagal menduplikat");
    }
  };

  const onReorder = async (id: string, direction: "up" | "down") => {
    const idx = rows.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= rows.length) return;

    const a = rows[idx];
    const b = rows[swapIdx];
    // Swap the two rows' actual sort_order values (not array indices).
    const orderA = (b as Record<string, any>).sort_order ?? swapIdx;
    const orderB = (a as Record<string, any>).sort_order ?? idx;

    // Optimistic reorder.
    setRows((rs) => {
      const next = [...rs];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });

    const results = await Promise.allSettled([
      fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: a.id, sort_order: orderA }) }),
      fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id, sort_order: orderB }) }),
    ]);
    if (results.some((r) => r.status === "fulfilled" && !r.value.ok)) {
      toast.error("Gagal menyimpan urutan");
      refresh();
    }
  };

  // Keyboard: n = new, Escape = close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "n" || open) return;
      const t = e.target;
      const typing =
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        (t instanceof HTMLElement && t.isContentEditable) ||
        document.querySelector("[role=\"dialog\"], [data-cmdk]");
      if (typing) return;
      e.preventDefault();
      startNew();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      <DataTable
        title={title}
        rows={rows}
        columns={columns}
        searchKeys={searchKeys}
        addLabel={addLabel ?? "Tambah"}
        onAdd={startNew}
        onEdit={startEdit}
        onDelete={onDelete}
        onClone={onClone}
        onBulkDelete={onBulkDelete}
        sortable={sortable}
        onReorder={sortable ? onReorder : undefined}
      />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-5 flex-row items-center justify-between">
            <SheetTitle>{editing ? `Edit ${title}` : `Tambah ${title}`}</SheetTitle>
            <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </SheetClose>
          </SheetHeader>
          <EntityForm
            key={editing?.id ?? "new"}
            initial={editing ?? {}}
            fields={fields}
            endpoint={endpoint}
            onSaved={(r) => {
              setRows((rs) => {
                const idx = rs.findIndex((x) => x.id === r.id);
                if (idx >= 0) { const cp = [...rs]; cp[idx] = r; return cp; }
                return [r, ...rs];
              });
              setOpen(false);
              refresh();
            }}
            submitLabel={editing ? "Simpan Perubahan" : "Tambah"}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
