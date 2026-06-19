"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Lazy image with a shimmer skeleton placeholder that fades into the image on
 * load. `wrapperClassName` sizes/positions the (relative) wrapper; `className`
 * styles the <img> (e.g. object-cover). The wrapper carries the shimmer until
 * load — give it a background-sized box (e.g. aspect-square, w-full h-full).
 */
export default function SmartImage({
  src,
  alt,
  wrapperClassName,
  className,
  eager = false,
}: {
  src: string;
  alt: string;
  wrapperClassName?: string;
  className?: string;
  eager?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className={cn("ahz-img-wrap", !loaded && "ahz-skeleton", loaded && "ahz-loaded", wrapperClassName)}
    >
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn("ahz-img", className)}
      />
    </div>
  );
}
