"use client";
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Icon } from "@/components/ui/icon";

type NavItem = { label: string; icon: string; href: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    label: "Navigasi",
    items: [
      { label: "Dashboard", icon: "layout-dashboard", href: "/admin/dashboard" },
      { label: "Live Chat", icon: "message-circle", href: "/admin/chat" },
      { label: "Artikel", icon: "newspaper", href: "/admin/articles" },
      { label: "Halaman", icon: "file-text", href: "/admin/pages" },
      { label: "Galeri", icon: "images", href: "/admin/gallery" },
      { label: "Bio Link", icon: "link", href: "/admin/bio-links" },
      { label: "Layanan", icon: "layout-template", href: "/admin/services" },
      { label: "Paket Harga", icon: "credit-card", href: "/admin/packages" },
      { label: "Testimoni", icon: "users", href: "/admin/testimonials" },
      { label: "FAQ", icon: "help-circle", href: "/admin/faqs" },
      { label: "Rekomendasi", icon: "package", href: "/admin/recommendations" },
      { label: "Media", icon: "image", href: "/admin/media" },
      { label: "Navigasi", icon: "panel-left", href: "/admin/navigation" },
      { label: "Tema", icon: "palette", href: "/admin/theme" },
      { label: "Proses Kerja", icon: "workflow", href: "/admin/process" },
      { label: "Keahlian", icon: "award", href: "/admin/skills" },
      { label: "Log Aktivitas", icon: "activity", href: "/admin/activity" },
      { label: "Pengaturan", icon: "settings", href: "/admin/settings" },
    ],
  },
  {
    label: "Aksi Cepat",
    items: [
      { label: "Tulis Artikel Baru", icon: "plus", href: "/admin/articles" },
      { label: "Upload Media", icon: "upload", href: "/admin/media" },
      { label: "Ubah Tema", icon: "palette", href: "/admin/theme" },
    ],
  },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Cari halaman atau aksi..." />
      <CommandList>
        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
        {NAV.map((g) => (
          <CommandGroup key={g.label} heading={g.label}>
            {g.items.map((item) => (
              <CommandItem
                key={item.href + item.label}
                onSelect={() => {
                  setOpen(false);
                  window.location.href = item.href;
                }}
              >
                <Icon name={item.icon} size={16} />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
