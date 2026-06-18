"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("ahz-theme", next ? "dark" : "light"); } catch (e) {}
  };

  // Avoid hydration mismatch: render the same icon until mounted.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      aria-pressed={mounted ? dark : undefined}
      title={dark ? "Mode terang" : "Mode gelap"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background hover:bg-accent transition-colors"
    >
      <Icon name={mounted && dark ? "check-circle" : "zap"} size={17} />
    </button>
  );
}
