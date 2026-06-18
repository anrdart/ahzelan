import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide font-display transition-colors",
  {
    variants: {
      variant: {
        default: "bg-royal-50 text-royal-700",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-rose-50 text-rose-600",
        outline: "border border-border text-foreground",
        accent: "bg-amber-500 text-white",
        soft: "bg-royal-50 text-royal-700",
        success: "bg-green-50 text-green-700",
        neutral: "bg-slate-100 text-slate-700",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
