"use client";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Plus, X } from "lucide-react";
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
}: {
  title: string;
  rows: T[];
  columns: Column<T>[];
  fields: Field[];
  endpoint: string;
  searchKeys?: (keyof T)[];
  addLabel?: string;
}) {
  const [rows, setRows] = useState<T[]>(initial);
  const [editing, setEditing] = useState<T | null>(null);
  const [open, setOpen] = useState(false);
  const refresh = async () => {
    const res = await fetch(endpoint + "?_list=1", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as T[];
      setRows(data);
    }
  };

  const startNew = () => { setEditing(null); setOpen(true); };
  const startEdit = (r: T) => { setEditing(r); setOpen(true); };
  const onDelete = async (r: T) => {
    await fetch(`${endpoint}?id=${r.id}`, { method: "DELETE" });
    setRows((rs) => rs.filter((x) => x.id !== r.id));
  };

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
            }}
            submitLabel={editing ? "Simpan Perubahan" : "Tambah"}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
