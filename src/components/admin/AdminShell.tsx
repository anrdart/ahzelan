"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Toaster, toast } from "sonner";
import CommandPalette from "./CommandPalette";
import ThemeToggle from "@/components/layout/ThemeToggle";

type NavItem = { id: string; label: string; icon: string; href: string };
type NavGroup = { label: string | null; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      { id: "dashboard", label: "Dashboard", icon: "layout-dashboard", href: "/admin/dashboard" },
      { id: "chat", label: "Live Chat", icon: "message-circle", href: "/admin/chat" },
    ],
  },
  {
    label: "Konten",
    items: [
      { id: "articles", label: "Artikel", icon: "newspaper", href: "/admin/articles" },
      { id: "pages", label: "Halaman", icon: "file-text", href: "/admin/pages" },
      { id: "gallery", label: "Galeri", icon: "images", href: "/admin/gallery" },
      { id: "bio-links", label: "Bio Link", icon: "link", href: "/admin/bio-links" },
    ],
  },
  {
    label: "Bisnis",
    items: [
      { id: "services", label: "Layanan", icon: "layout-template", href: "/admin/services" },
      { id: "packages", label: "Paket Harga", icon: "credit-card", href: "/admin/packages" },
      { id: "testimonials", label: "Testimoni", icon: "users", href: "/admin/testimonials" },
      { id: "faqs", label: "FAQ", icon: "help-circle", href: "/admin/faqs" },
      { id: "recommendations", label: "Rekomendasi", icon: "package", href: "/admin/recommendations" },
    ],
  },
  {
    label: "Tampilan",
    items: [
      { id: "media", label: "Media", icon: "image", href: "/admin/media" },
      { id: "navigation", label: "Navigasi", icon: "panel-left", href: "/admin/navigation" },
      { id: "theme", label: "Tema", icon: "palette", href: "/admin/theme" },
      { id: "process", label: "Proses Kerja", icon: "workflow", href: "/admin/process" },
      { id: "skills", label: "Keahlian", icon: "award", href: "/admin/skills" },
    ],
  },
  {
    label: "Sistem",
    items: [
      { id: "activity", label: "Log Aktivitas", icon: "activity", href: "/admin/activity" },
      { id: "settings", label: "Pengaturan", icon: "settings", href: "/admin/settings" },
    ],
  },
];

const isActive = (href: string, current: string) => current === href || current.startsWith(href + "/");

export default function AdminShell({
  title,
  crumbs,
  currentPath,
  userEmail,
  children,
}: {
  title: string;
  crumbs: { label: string; href?: string }[];
  currentPath: string;
  userEmail: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  useEffect(() => setHydrated(true), []);

  // Poll unread chat count for the sidebar badge (every 20s + on focus).
  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const r = await fetch("/api/admin/chat/unread", { cache: "no-store" });
        if (r.ok && active) {
          const d = (await r.json().catch(() => ({}))) as { unread?: number };
          setChatUnread(d.unread ?? 0);
        }
      } catch {}
    };
    tick();
    const id = setInterval(tick, 20000);
    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);
    return () => { active = false; clearInterval(id); window.removeEventListener("focus", onFocus); };
  }, []);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen flex bg-surface-page">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 bg-sidebar border-r border-border transition-transform lg:relative lg:translate-x-0 flex flex-col",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-16 flex items-center gap-2 px-5 border-b border-border">
          <a href="/admin/dashboard">
            <img src="/brand/ahzelan-logo-color.png" alt="Ahzelan" className="h-6 w-auto" />
          </a>
          <span className="text-[10px] font-bold text-royal-700 bg-royal-50 px-1.5 py-0.5 rounded font-display">ADMIN</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
          {NAV_GROUPS.map((g, gi) => (
            <div key={gi}>
              {g.label && (
                <div className="px-3 pt-4 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">{g.label}</div>
              )}
              {g.items.map((n) => (
                <a
                  key={n.id}
                  href={n.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg font-display font-semibold text-[14px] transition-colors",
                    isActive(n.href, currentPath)
                      ? "bg-royal-50 text-royal-700"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <Icon name={n.icon} size={18} />
                  <span className="flex-1">{n.label}</span>
                  {n.id === "chat" && chatUnread > 0 && (
                    <span
                      aria-label={`${chatUnread} pesan belum dibaca`}
                      className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center"
                    >{chatUnread}</span>
                  )}
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-3.5 border-t border-border flex items-center gap-2.5">
          <Avatar name={userEmail} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-[13.5px] truncate">{userEmail.split("@")[0]}</div>
            <div className="text-xs text-muted-foreground">Admin</div>
          </div>
          <button
            onClick={logout}
            aria-label="Logout"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            title="Logout"
          >
            <Icon name="log-out" size={16} />
          </button>
        </div>
      </aside>

      {/* Backdrop */}
      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/40 lg:hidden" />}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 sticky top-0 z-20 bg-card/85 backdrop-blur-md border-b border-border flex items-center gap-4 px-6">
          <button onClick={() => setOpen(true)} aria-label="Menu" className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background">
            <Icon name="menu" size={18} />
          </button>
          <div className="flex-1 min-w-0">
            {crumbs && crumbs.length > 0 && (
              <div className="mb-0.5">
                <Breadcrumb items={crumbs} />
              </div>
            )}
            <h1 className="text-[19px] font-extrabold font-display truncate">{title}</h1>
          </div>
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 text-muted-foreground text-sm w-48 hover:bg-muted/80 transition-colors"
          >
            <Icon name="search" size={15} />
            <span>Cari...</span>
            <kbd className="ml-auto font-mono text-[11px] bg-background border border-border rounded px-1.5 py-px">⌘K</kbd>
          </button>
          <ThemeToggle />
          <button aria-label="Notifikasi" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background">
            <Icon name="bell" size={17} />
          </button>
        </header>
        <main className="flex-1 p-6 lg:p-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
      <CommandPalette />
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
