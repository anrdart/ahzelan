"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { SITE, waLink } from "@/lib/site";

/**
 * Floating WhatsApp + Contact dialog.
 * Mounted at PublicLayout. Uses a custom event so any "Chat Ahzelan" link
 * anywhere on the site can open the same modal.
 */
export default function WhatsAppFloat() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("ahz:open-contact", onOpen);
    return () => window.removeEventListener("ahz:open-contact", onOpen);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Chat WhatsApp"
        className="fixed right-5 bottom-5 z-50 inline-flex items-center gap-2.5 h-14 rounded-full bg-primary pl-5 pr-6 text-white shadow-brand font-display font-bold text-[15px] hover:scale-[1.03] active:scale-[0.97] transition-transform"
      >
        <Icon name="message-circle" size={22} />
        <span className="hidden sm:inline">Chat Ahzelan</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-royal-50 text-royal-700 flex items-center justify-center mb-4">
            <Icon name="message-circle" size={32} />
          </div>
          <DialogHeader className="space-y-2 items-center">
            <DialogTitle className="text-2xl">Ngobrol via WhatsApp</DialogTitle>
            <DialogDescription className="text-[15px] leading-relaxed">
              Konsultasi gratis, santai aja. Klik tombol di bawah buat mulai chat dengan Ahzelan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            <Button asChild size="lg" className="w-full">
              <a href={waLink(SITE.whatsapp)} target="_blank" rel="noopener">
                <Icon name="message-circle" size={18} /> Buka WhatsApp
              </a>
            </Button>
            <DialogClose asChild>
              <button className="text-sm font-display font-semibold text-muted-foreground hover:text-foreground py-2">
                Nanti aja
              </button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
