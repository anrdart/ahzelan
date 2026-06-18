"use client";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export type FaqItem = { question: string; answer: string };

export default function FaqAccordion({ items, defaultOpen }: { items: FaqItem[]; defaultOpen?: string }) {
  return (
    <Accordion type="single" collapsible defaultValue={defaultOpen} className="rounded-2xl border border-border bg-card px-2 sm:px-4 shadow-xs">
      {items.map((f, i) => (
        <AccordionItem key={i} value={`q-${i}`}>
          <AccordionTrigger>{f.question}</AccordionTrigger>
          <AccordionContent>{f.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
