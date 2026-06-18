"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Toaster, toast } from "sonner";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "layout-dashboard", href: "/admin/dashboard" },
  { id: "pages", label: "Halaman", icon: "file-text", href: "/admin/pages" },
  { id: "media", label: "Media", icon: "image", href: "/admin/media" },
  { id: "theme", label: "Tema", icon: "palette", href: "/admin/theme" },
  { id: "navigation", label: "Navigasi", icon: "panel-left", href: "/admin/navigation" },
  { id: "services", label: "Layanan", icon: "layout-template", href: "/admin/services" },
  { id: "packages", label: "Paket Harga", icon: "credit-card", href: "/admin/packages" },
  { id: "testimonials", label: "Testimoni", icon: "users", href: "/admin/testimonials" },
  { id: "faqs", label: "FAQ", icon: "message-circle", href: "/admin/faqs" },
  { id: "recommendations", label: "Rekomendasi", icon: "package", href: "/admin/recommendations" },
  { id: "articles", label: "Artikel", icon: "file-text", href: "/admin/articles" },
  { id: "settings", label: "Pengaturan", icon: "settings", href: "/admin/settings" },
] as const;

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
  useEffect(() => setHydrated(true), []);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen flex bg-surface-page">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-border transition-transform lg:relative lg:translate-x-0 flex flex-col",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-16 flex items-center gap-2 px-5 border-b border-border">
          <a href="/admin/dashboard">
            <img src="/brand/ahzelan-logo-color.png" alt="Ahzelan" className="h-6 w-auto" />
          </a>
          <span className="text-[10px] font-bold text-royal-700 bg-royal-50 px-1.5 py-0.5 rounded font-display">ADMIN</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={n.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg font-display font-semibold text-[14.5px] transition-colors",
                isActive(n.href, currentPath)
                  ? "bg-royal-50 text-royal-700"
                  : "text-foreground hover:bg-muted",
              )}
            >
              <Icon name={n.icon} size={19} />
              {n.label}
            </a>
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
        <header className="h-16 sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-border flex items-center gap-4 px-6">
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
          <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 text-muted-foreground text-sm w-48">
            <Icon name="search" size={15} />
            <span>Cari...</span>
            <kbd className="ml-auto font-mono text-[11px] bg-background border border-border rounded px-1.5 py-px">⌘K</kbd>
          </div>
          <button aria-label="Notifikasi" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background">
            <Icon name="bell" size={17} />
          </button>
        </header>
        <main className="flex-1 p-6 lg:p-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
