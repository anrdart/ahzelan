"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Pencil, Eye, Trash2, Plus, Search } from "lucide-react";
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

export default function DataTable<T extends { id: string; is_visible?: boolean; status?: string }>({
  title,
  rows,
  columns,
  addLabel = "Tambah",
  addHref,
  onAdd,
  onEdit,
  onDelete,
  onView,
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
  searchKeys?: (keyof T)[];
  refresh?: () => void;
}) {
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = rows.filter((r) => {
    const t = q.toLowerCase().trim();
    if (!t) return true;
    return searchKeys.some((k) => String((r as any)[k] ?? "").toLowerCase().includes(t));
  });

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      <div className="p-4 flex flex-wrap gap-3 items-center border-b border-border">
        <div className="flex-1 min-w-[200px] max-w-sm relative">
          <Input
            placeholder={`Cari ${title.toLowerCase()}…`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex-1" />
        {(addHref || onAdd) && (
          <Button onClick={onAdd} asChild={!!addHref}>
            {addHref ? <a href={addHref}><Plus size={16} /> {addLabel}</a> : <><Plus size={16} /> {addLabel}</>}
          </Button>
        )}
      </div>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={String(c.key)} className={c.className}>{c.label}</TableHead>
              ))}
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-12 text-muted-foreground">
                  Belum ada data. Tambah yang pertama.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  {columns.map((c) => (
                    <TableCell key={String(c.key)} className={cn(c.className, c.hideOn === "sm" && "hidden md:table-cell")}>
                      {c.render ? c.render(r) : <AutoCell value={(r as any)[c.key]} field={String(c.key)} />}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex gap-1.5 justify-end">
                      {onView && (
                        <button onClick={() => onView(r)} aria-label="Lihat" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                          <Eye size={15} />
                        </button>
                      )}
                      {onEdit && (
                        <button onClick={() => onEdit(r)} aria-label="Edit" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                          <Pencil size={15} />
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => setConfirm(r)} aria-label="Hapus" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-rose-500 hover:bg-rose-50">
                          <Trash2 size={15} />
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
    </div>
  );
}
