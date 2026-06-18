"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site";

type Item = { readonly label: string; readonly href: string; readonly children?: readonly { readonly label: string; readonly href: string }[] };

export default function MobileNav({ items, currentPath }: { items: readonly Item[]; currentPath: string }) {
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === "/" ? currentPath === "/" : currentPath === href || currentPath.startsWith(href + "/");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Menu"
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background hover:bg-accent"
        >
          <Icon name="menu" size={20} />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[88vw] max-w-sm p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2.5">
            <img src="/brand/ahzelan-wordmark.png" alt="Ahzelan" className="h-7 w-auto" />
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1 p-4">
          {items.map((it) => (
            <div key={it.href}>
              <SheetClose asChild>
                <a
                  href={it.href}
                  className={cn(
                    "block px-4 py-3 rounded-md font-display font-semibold text-[15.5px]",
                    isActive(it.href) ? "text-royal-700 bg-royal-50" : "text-foreground hover:bg-muted",
                  )}
                >
                  {it.label}
                </a>
              </SheetClose>
              {it.children?.map((c) => (
                <SheetClose asChild key={c.href}>
                  <a
                    href={c.href}
                    className="ml-4 block px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md"
                  >
                    {c.label}
                  </a>
                </SheetClose>
              ))}
            </div>
          ))}
          <a
            href={`https://wa.me/${SITE.whatsapp}`}
            target="_blank"
            rel="noopener"
            className="mt-4 inline-flex items-center justify-center gap-2 h-12 rounded-md bg-primary px-5 text-sm font-semibold font-display text-primary-foreground shadow-brand-sm"
          >
            <Icon name="message-circle" size={18} /> Chat Ahzelan
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
