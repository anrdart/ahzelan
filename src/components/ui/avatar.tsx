"use client";
import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    name?: string;
    src?: string;
    size?: "sm" | "md" | "lg" | "xl";
    ring?: boolean;
  }
>(({ className, name, src, size = "md", ring, ...props }, ref) => {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-base", xl: "h-24 w-24 text-2xl" };
  const initials = (name ?? "")
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full bg-royal-50 text-royal-700 font-display font-bold align-middle",
        sizes[size],
        ring && "ring-4 ring-white shadow-lg",
        className,
      )}
      {...props}
    >
      {src && <AvatarPrimitive.Image src={src} alt={name ?? ""} className="h-full w-full object-cover" />}
      <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center">{initials}</AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
});
Avatar.displayName = "Avatar";

const AvatarImage = AvatarPrimitive.Image;

export { Avatar, AvatarImage };
