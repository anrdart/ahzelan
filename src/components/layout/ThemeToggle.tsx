"use client";
import { useEffect, useState } from "react";

/**
 * Theme toggle with sun/moon animation.
 *  - Sun shown in light mode (yellow circle, orange rays)
 *  - Moon shown in dark mode (crescent with crater dots)
 *  - Icons rotate + scale + fade across each other when toggling
 *  - Smooth easing for the swap (~500ms)
 */
export default function ThemeToggle() {
  // Lazy-init from the actual applied theme (theme-init.js already set .dark
  // before hydration) so the icon + label match pre-paint, no flash.
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    const root = document.documentElement;
    // Enable the global color transition only for the duration of the swap.
    root.classList.add("theme-transitioning");
    root.classList.toggle("dark", next);
    try { localStorage.setItem("ahz-theme", next ? "dark" : "light"); } catch (e) {}
    window.setTimeout(() => root.classList.remove("theme-transitioning"), 360);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      title={dark ? "Mode terang" : "Mode gelap"}
      className="ahz-theme-toggle relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-input bg-background hover:bg-accent transition-colors overflow-hidden"
    >
      <span className={`ahz-theme-icon sun ${dark ? "out" : "in"}`} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
          <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      </span>
      <span className={`ahz-theme-icon moon ${dark ? "in" : "out"}`} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-slate-200">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
        </svg>
      </span>
      <style>{`
        .ahz-theme-toggle { transition: background-color .3s ease, border-color .3s ease; }
        .ahz-theme-icon {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity .42s cubic-bezier(.22,1,.36,1),
                      transform .55s cubic-bezier(.34,1.56,.64,1);
          will-change: opacity, transform;
        }
        .ahz-theme-icon.in {
          opacity: 1;
          transform: rotate(0deg) scale(1);
        }
        .ahz-theme-icon.out {
          opacity: 0;
          transform: rotate(-120deg) scale(.4);
          pointer-events: none;
        }
        .ahz-theme-icon.moon.out {
          transform: rotate(120deg) scale(.4);
        }
        .ahz-theme-toggle:hover .ahz-theme-icon.in {
          transform: rotate(20deg) scale(1.08);
        }
        .ahz-theme-toggle:active .ahz-theme-icon.in {
          transform: rotate(0deg) scale(.9);
        }
        @media (prefers-reduced-motion: reduce) {
          .ahz-theme-icon { transition: opacity .15s linear; transform: none !important; }
        }
      `}</style>
    </button>
  );
}
