"use client";
import { useState } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

export type FieldType = "text" | "textarea" | "number" | "url" | "select" | "boolean" | "list" | "json";
export type Field = {
  /** one of FieldType; typed as string so un-annotated .astro literals don't widen-fail */
  type: string;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  help?: string;
  rows?: number;
  options?: { value: string; label: string }[];
};

export default function EntityForm({
  initial,
  fields,
  endpoint,
  onSaved,
  submitLabel = "Simpan",
}: {
  initial: Record<string, any>;
  fields: Field[];
  endpoint: string;
  onSaved?: (row: any) => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Record<string, any>>(() => {
    const v: Record<string, any> = { ...initial };
    fields.forEach((f) => {
      if (f.type === "list" && typeof v[f.name] === "string") v[f.name] = v[f.name] ? v[f.name].split("\n") : [];
      if (f.type === "json" && typeof v[f.name] === "string") {
        try { v[f.name] = JSON.parse(v[f.name]); } catch { v[f.name] = []; }
      }
    });
    return v;
  });
  const [busy, setBusy] = useState(false);

  const set = (k: string, v: any) => setValues((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload: Record<string, any> = { ...values };
      fields.forEach((f) => {
        if (f.type === "list" && Array.isArray(payload[f.name])) payload[f.name] = payload[f.name];
        if (f.type === "json") {
          if (typeof payload[f.name] === "string") {
            try { payload[f.name] = JSON.parse(payload[f.name]); } catch { payload[f.name] = []; }
          }
        }
      });
      const method = values.id ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      toast.success("Tersimpan");
      onSaved?.(data);
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white border border-border rounded-2xl p-6 space-y-5">
      {fields.map((f) => {
        const id = `f-${f.name}`;
        if (f.type === "boolean") {
          return (
            <div key={f.name} className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor={id}>{f.label}</Label>
                {f.help && <p className="text-xs text-muted-foreground mt-1">{f.help}</p>}
              </div>
              <Switch id={id} checked={!!values[f.name]} onCheckedChange={(v) => set(f.name, v)} />
            </div>
          );
        }
        if (f.type === "select") {
          return (
            <div key={f.name}>
              <Label htmlFor={id}>{f.label}{f.required && " *"}</Label>
              <Select value={String(values[f.name] ?? "")} onValueChange={(v) => set(f.name, v)}>
                <SelectTrigger id={id} className="mt-1.5">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  {(f.options ?? []).map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {f.help && <p className="text-xs text-muted-foreground mt-1.5">{f.help}</p>}
            </div>
          );
        }
        if (f.type === "textarea") {
          return (
            <div key={f.name}>
              <Label htmlFor={id}>{f.label}{f.required && " *"}</Label>
              <Textarea
                id={id}
                rows={f.rows ?? 4}
                value={values[f.name] ?? ""}
                onChange={(e) => set(f.name, e.target.value)}
                className="mt-1.5"
              />
              {f.help && <p className="text-xs text-muted-foreground mt-1.5">{f.help}</p>}
            </div>
          );
        }
        if (f.type === "list") {
          const v = Array.isArray(values[f.name]) ? values[f.name].join("\n") : "";
          return (
            <div key={f.name}>
              <Label htmlFor={id}>{f.label}</Label>
              <Textarea
                id={id}
                rows={4}
                value={v}
                onChange={(e) => set(f.name, e.target.value.split("\n"))}
                placeholder={"Satu item per baris"}
                className="mt-1.5"
              />
              {f.help && <p className="text-xs text-muted-foreground mt-1.5">{f.help}</p>}
            </div>
          );
        }
        if (f.type === "json") {
          return (
            <div key={f.name}>
              <Label htmlFor={id}>{f.label}</Label>
              <Textarea
                id={id}
                rows={6}
                value={JSON.stringify(values[f.name] ?? [], null, 2)}
                onChange={(e) => set(f.name, e.target.value)}
                className="mt-1.5 font-mono text-[13px]"
              />
              {f.help && <p className="text-xs text-muted-foreground mt-1.5">{f.help}</p>}
            </div>
          );
        }
        return (
          <div key={f.name}>
            <Label htmlFor={id}>{f.label}{f.required && " *"}</Label>
            <Input
              id={id}
              type={f.type as React.HTMLInputTypeAttribute}
              required={f.required}
              placeholder={f.placeholder}
              value={values[f.name] ?? ""}
              onChange={(e) => set(f.name, f.type === "number" ? Number(e.target.value) : e.target.value)}
              className="mt-1.5"
            />
            {f.help && <p className="text-xs text-muted-foreground mt-1.5">{f.help}</p>}
          </div>
        );
      })}
      <div className="flex gap-2 justify-end pt-2 border-t border-border">
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {submitLabel}
        </Button>
      </div>
    </form>
  );
}
