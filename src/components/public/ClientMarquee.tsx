"use client";
import { useEffect, useRef, useState } from "react";
import { CLIENT_LOGOS } from "@/lib/site";

/**
 * Interactive client-logo marquee.
 *  - Auto-scrolls left at constant speed
 *  - Pauses on hover or while the user is dragging
 *  - Drag with mouse/touch to scrub back/forth
 *  - Loops seamlessly (track is duplicated)
 */
export default function ClientMarquee() {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const speed = 30; // px per second
  const halfWidthRef = useRef<number>(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    // Track is rendered twice side-by-side; one full loop = half its scrollWidth.
    halfWidthRef.current = el.scrollWidth / 2;

    let raf = 0;
    const tick = (ts: number) => {
      const prev = lastTsRef.current ?? ts;
      const dt = (ts - prev) / 1000;
      lastTsRef.current = ts;
      if (!pausedRef.current && !draggingRef.current && halfWidthRef.current) {
        offsetRef.current -= speed * dt;
        if (-offsetRef.current >= halfWidthRef.current) {
          offsetRef.current += halfWidthRef.current;
        }
        el.style.transform = `translate3d(${offsetRef.current}px,0,0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const setPause = (v: boolean) => {
    pausedRef.current = v;
    setPaused(v);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    lastXRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    offsetRef.current += dx;
    if (halfWidthRef.current && -offsetRef.current >= halfWidthRef.current) {
      offsetRef.current += halfWidthRef.current;
    } else if (offsetRef.current > 0) {
      offsetRef.current -= halfWidthRef.current;
    }
    if (trackRef.current) trackRef.current.style.transform = `translate3d(${offsetRef.current}px,0,0)`;
  };
  const onPointerUp = () => { draggingRef.current = false; };

  return (
    <div className="overflow-hidden border border-border rounded-2xl bg-white select-none"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
      <div
        ref={trackRef}
        className="flex w-max gap-4 px-4 py-6 will-change-transform cursor-grab active:cursor-grabbing"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {[...CLIENT_LOGOS, ...CLIENT_LOGOS].map((c, i) => (
          <div
            key={`${c.name}-${i}`}
            className="shrink-0 w-44 h-16 flex items-center justify-center px-4 bg-white border border-border rounded-xl"
            title={c.name}
            aria-label={c.name}
          >
            <img src={c.src} alt={c.name} loading="lazy" className="max-h-10 max-w-full object-contain" draggable={false} />
          </div>
        ))}
      </div>
      <div className="px-4 py-2 text-center text-xs text-muted-foreground border-t border-border bg-surface-page">
        {paused ? "Drag untuk menggulir • " : "Arahkan kursor untuk pause • "} Klik & seret untuk menggeser
      </div>
    </div>
  );
}
