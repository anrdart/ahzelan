"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Pencil, Eye, Trash2, Plus, Copy, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import ConfirmDialog from "./ConfirmDialog";

export type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  hideOn?: string;
  className?: string;
};

function AutoCell({ value, field }: { value: unknown; field: string }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;
  if (typeof value === "boolean") {
    return (
      <Badge variant={value ? "success" : "neutral"} dot={value}>
        {value ? "Aktif" : "Off"}
      </Badge>
    );
  }
  if (field === "status" && typeof value === "string") {
    const isPub = value === "published" || value === "Published";
    return <Badge variant={isPub ? "success" : "neutral"} dot={isPub}>{value}</Badge>;
  }
  if (field === "is_featured" && typeof value === "boolean") {
    return value ? <Badge variant="accent">Unggulan</Badge> : <span className="text-muted-foreground text-sm">—</span>;
  }
  return <>{String(value)}</>;
}

export default function DataTable<T extends { id: string; is_visible?: boolean; status?: string; sort_order?: number }>({
  title,
  rows,
  columns,
  addLabel = "Tambah",
  addHref,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onClone,
  onBulkDelete,
  onReorder,
  sortable = false,
  searchKeys = ["title", "name", "question"] as any,
  refresh,
}: {
  title: string;
  rows: T[];
  columns: Column<T>[];
  addLabel?: string;
  addHref?: string;
  onAdd?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => Promise<void> | void;
  onView?: (row: T) => void;
  onClone?: (row: T) => Promise<void> | void;
  onBulkDelete?: (ids: string[]) => Promise<void> | void;
  onReorder?: (id: string, direction: "up" | "down") => void;
  sortable?: boolean;
  searchKeys?: (keyof T)[];
  refresh?: () => void;
}) {
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState<T | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  // Drop selection when the row set changes (delete/refresh) so stale ids can't survive.
  useEffect(() => {
    setSelected((s) => {
      const ids = new Set(rows.map((r) => r.id));
      if (s.size === 0) return s;
      const pruned = new Set([...s].filter((id) => ids.has(id)));
      return pruned.size === s.size ? s : pruned;
    });
  }, [rows]);

  const filtered = rows.filter((r) => {
    const t = q.toLowerCase().trim();
    if (!t) return true;
    return searchKeys.some((k) => String((r as any)[k] ?? "").toLowerCase().includes(t));
  });

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };

  const hasSelection = selected.size > 0;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 flex flex-wrap gap-3 items-center border-b border-border">
        <div className="flex-1 min-w-[200px] max-w-sm relative">
          <Input
            placeholder={`Cari ${title.toLowerCase()}…`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex-1" />
        {hasSelection && onBulkDelete && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selected.size} dipilih</span>
            <Button variant="destructive" size="sm" onClick={() => setBulkConfirm(true)}>
              <Trash2 size={14} /> Hapus
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Batal</Button>
          </div>
        )}
        {!hasSelection && (addHref || onAdd) && (
          <Button onClick={onAdd} asChild={!!addHref}>
            {addHref ? <a href={addHref}><Plus size={16} /> {addLabel}</a> : <><Plus size={16} /> {addLabel}</>}
          </Button>
        )}
      </div>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {onBulkDelete && (
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleAll}
                    className="rounded border-border"
                  />
                </TableHead>
              )}
              {columns.map((c, ci) => (
                <TableHead key={`${String(c.key)}-${ci}`} className={c.className}>{c.label}</TableHead>
              ))}
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (onBulkDelete ? 2 : 1)} className="text-center py-12 text-muted-foreground">
                  Belum ada data. Tambah yang pertama.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r, idx) => (
                <TableRow key={r.id} className={cn(selected.has(r.id) && "bg-muted/50")}>
                  {onBulkDelete && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="rounded border-border"
                      />
                    </TableCell>
                  )}
                  {columns.map((c, ci) => (
                    <TableCell key={`${String(c.key)}-${ci}`} className={cn(c.className, c.hideOn === "sm" && "hidden md:table-cell")}>
                      {c.render ? c.render(r) : <AutoCell value={(r as any)[c.key]} field={String(c.key)} />}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {sortable && onReorder && (
                        <>
                          <button onClick={() => onReorder(r.id, "up")} disabled={idx === 0} aria-label="Naik" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30">
                            <ChevronUp size={14} />
                          </button>
                          <button onClick={() => onReorder(r.id, "down")} disabled={idx === filtered.length - 1} aria-label="Turun" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30">
                            <ChevronDown size={14} />
                          </button>
                        </>
                      )}
                      {onView && (
                        <button onClick={() => onView(r)} aria-label="Lihat" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                          <Eye size={14} />
                        </button>
                      )}
                      {onEdit && (
                        <button onClick={() => onEdit(r)} aria-label="Edit" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                          <Pencil size={14} />
                        </button>
                      )}
                      {onClone && (
                        <button onClick={() => onClone(r)} aria-label="Duplikat" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                          <Copy size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => setConfirm(r)} aria-label="Hapus" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-rose-500 hover:bg-rose-50">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Hapus ${title.toLowerCase()} ini?`}
        description="Tindakan ini tidak bisa dibatalkan."
        loading={busy}
        onConfirm={async () => {
          if (!confirm || !onDelete) return;
          setBusy(true);
          try {
            await onDelete(confirm);
            setConfirm(null);
            refresh?.();
          } finally {
            setBusy(false);
          }
        }}
      />
      <ConfirmDialog
        open={bulkConfirm}
        onOpenChange={(o) => !o && setBulkConfirm(false)}
        title={`Hapus ${selected.size} ${title.toLowerCase()}?`}
        description="Semua item yang dipilih akan dihapus permanen."
        loading={busy}
        onConfirm={async () => {
          if (!onBulkDelete) return;
          setBusy(true);
          try {
            await onBulkDelete(Array.from(selected));
            setSelected(new Set());
            setBulkConfirm(false);
            refresh?.();
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
