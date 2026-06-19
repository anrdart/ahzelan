"use client";
import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { ExternalLink } from "lucide-react";

type Item = { id: string; title: string; category: string; description: string; link: string; badge?: string; icon?: string | null };
const ICON_BY_TITLE: Record<string, string> = {
  niagahoster: "server", elementor: "extension", midtrans: "credit-card", canva: "palette",
  "landing kit": "layout-template", ubersuggest: "search",
};

/** Falls back to title/category heuristic when a row has no explicit icon. */
function iconFor(r: Item): string {
  if (r.icon) return r.icon;
  const byTitle = ICON_BY_TITLE[r.title.toLowerCase()];
  if (byTitle) return byTitle;
  const c = (r.category ?? "").toLowerCase();
  if (c.includes("hosting")) return "server";
  if (c.includes("plugin")) return "puzzle";
  if (c.includes("payment")) return "credit-card";
  if (c.includes("template")) return "layout-template";
  if (c.includes("tools")) return "palette";
  return "layout-template";
}

export default function RekomendasiFilter({ items }: { items: Item[] }) {
  const cats = useMemo(() => ["Semua", ...Array.from(new Set(items.map((i) => i.category)))], [items]);
  const [cat, setCat] = useState("Semua");
  const list = cat === "Semua" ? items : items.filter((i) => i.category === cat);

  return (
    <>
      <div className="flex justify-center mb-8">
        <Tabs value={cat} onValueChange={setCat}>
          <TabsList>
            {cats.map((c) => (
              <TabsTrigger key={c} value={c}>{c}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {list.map((r) => {
          const icon = iconFor(r);
          return (
            <div key={r.id} className="ahz-card-lift rounded-lg border border-border bg-card p-5">
              <div className="flex justify-between items-start mb-3.5">
                <span className="w-12 h-12 rounded-xl bg-muted text-slate-700 dark:bg-slate-800 dark:text-slate-200 flex items-center justify-center">
                  <Icon name={icon} size={24} />
                </span>
                {r.badge && <Badge variant="soft">{r.badge}</Badge>}
              </div>
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{r.category}</div>
              <h3 className="text-lg font-bold mt-0.5 mb-2">{r.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{r.description}</p>
              <a
                href={r.link}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center justify-center w-full h-9 rounded-md border border-input bg-background hover:bg-accent text-sm font-semibold font-display"
              >
                Lihat Detail <ExternalLink size={14} className="ml-1.5" />
              </a>
            </div>
          );
        })}
      </div>
    </>
  );
}
