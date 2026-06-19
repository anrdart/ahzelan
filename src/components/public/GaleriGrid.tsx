"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Item = { image_url: string; caption: string | null; aspect_w: number; aspect_h: number };

export default function GaleriGrid({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<Item | null>(null);

  return (
    <>
      <div
        className="grid gap-3.5"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gridAutoRows: "180px", gridAutoFlow: "dense" }}
      >
        {items.map((it, i) => {
          const span = it.aspect_h >= it.aspect_w ? { gridRow: "span 2" } : { gridColumn: "span 2", gridRow: "span 1" };
          return (
            <button
              key={i}
              onClick={() => setOpen(it)}
              className="group relative overflow-hidden rounded-2xl border border-border bg-muted text-left"
              style={span}
            >
              <img
                src={it.image_url}
                alt={it.caption ?? ""}
                width={it.aspect_w}
                height={it.aspect_h}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-black/40" />
              <div className="absolute bottom-0 left-0 right-0 p-3.5">
                <div className="text-white text-sm font-display font-semibold drop-shadow">{it.caption}</div>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-4xl p-2 sm:p-3 bg-transparent border-0 shadow-none">
          <DialogTitle className="sr-only">{open?.caption ?? "Galeri"}</DialogTitle>
          {open && (
            <div className="relative">
              <img src={open.image_url} alt={open.caption ?? ""} className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" />
              <div className="absolute bottom-3 left-3 right-3 text-white font-display font-semibold drop-shadow text-center">{open.caption}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
