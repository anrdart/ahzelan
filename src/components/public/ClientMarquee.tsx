"use client";
import { useEffect, useRef, useState } from "react";
import { CLIENT_LOGOS } from "@/lib/site";

/**
 * Interactive client-logo marquee.
 *  - Auto-scrolls left at constant speed
 *  - Pauses on hover or while the user is dragging
 *  - Drag with mouse/touch to scrub back/forth
 *  - Loops seamlessly (track is duplicated)
 *  - Edge fade (left/right) so logos appear/disappear smoothly
 *  - No card chrome; logos default to grayscale, restore color on hover
 */
export default function ClientMarquee() {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const pausedRef = useRef(false);
  const halfWidthRef = useRef<number>(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    halfWidthRef.current = el.scrollWidth / 2;

    let raf = 0;
    const tick = (ts: number) => {
      const prev = lastTsRef.current ?? ts;
      const dt = (ts - prev) / 1000;
      lastTsRef.current = ts;
      if (!pausedRef.current && !draggingRef.current && halfWidthRef.current) {
        offsetRef.current -= 30 * dt; // 30 px/s
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
    <div
      className="ahz-marquee relative overflow-hidden select-none"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      <div
        ref={trackRef}
        className="flex w-max gap-12 sm:gap-16 py-8 will-change-transform cursor-grab active:cursor-grabbing"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {[...CLIENT_LOGOS, ...CLIENT_LOGOS].map((c, i) => (
          <img
            key={`${c.name}-${i}`}
            src={c.src}
            alt={c.name}
            loading="lazy"
            title={c.name}
            draggable={false}
            className="ahz-marquee-logo shrink-0 h-12 sm:h-14 w-auto max-w-[160px] object-contain select-none"
          />
        ))}
      </div>
      <style>{`
        .ahz-marquee {
          /* Fade logos at both edges so they bleed out smoothly.
             -webkit-mask works in Safari; mask for modern browsers. */
          mask-image: linear-gradient(to right, transparent 0, #000 8%, #000 92%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0, #000 8%, #000 92%, transparent 100%);
        }
        .ahz-marquee-logo {
          /* default = no color (grayscale + slight dim) */
          filter: grayscale(1) opacity(0.55);
          transition: filter .35s ease, opacity .35s ease, transform .35s ease;
        }
        /* on hover any logo → full color + slight lift */
        .ahz-marquee:hover .ahz-marquee-logo {
          filter: grayscale(1) opacity(0.78);
        }
        .ahz-marquee-logo:hover {
          filter: grayscale(0) opacity(1) !important;
          transform: translateY(-2px);
        }
        /* respect motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .ahz-marquee-logo { transition: none; }
        }
      `}</style>
    </div>
  );
}
