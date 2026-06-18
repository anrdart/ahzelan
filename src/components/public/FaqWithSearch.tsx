"use client";
import { useMemo, useState } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { MessageCircle } from "lucide-react";

type Faq = { question: string; answer: string; category: string };

export default function FaqWithSearch({ items }: { items: Faq[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim();
    if (!t) return items;
    return items.filter((i) => i.question.toLowerCase().includes(t) || i.answer.toLowerCase().includes(t));
  }, [q, items]);

  return (
    <>
      <div className="relative mb-6 max-w-md mx-auto">
        <Input
          placeholder="Cari FAQ…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {filtered.length ? (
        <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-2 sm:px-4 shadow-xs">
          {filtered.map((f, i) => (
            <AccordionItem key={i} value={`q-${i}`}>
              <AccordionTrigger>{f.question}</AccordionTrigger>
              <AccordionContent>{f.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-center py-12 text-muted-foreground">Nggak ketemu — coba kata kunci lain atau langsung chat ya.</div>
      )}
      <div className="text-center mt-7">
        <Button
          variant="ghost"
          onClick={() => window.dispatchEvent(new Event("ahz:open-contact"))}
        >
          <MessageCircle size={18} /> Ada yang kurang jelas? Chat Ahzelan sini
        </Button>
      </div>
    </>
  );
}
