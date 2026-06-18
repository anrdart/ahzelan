import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("relative w-full rounded-xl border px-4 py-3.5 text-sm flex gap-3 [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:mt-0.5", {
  variants: {
    variant: {
      default: "bg-card border-border text-foreground",
      info: "bg-teal-50 border-teal-100 text-teal-700 [&>svg]:text-teal-600",
      success: "bg-green-50 border-green-200 text-green-700 [&>svg]:text-green-600",
      warning: "bg-amber-50 border-amber-200 text-amber-600 [&>svg]:text-amber-500",
      destructive: "bg-rose-50 border-rose-200 text-rose-600 [&>svg]:text-rose-500",
    },
  },
  defaultVariants: { variant: "default" },
});

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  ),
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-0.5 font-display font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed opacity-90", className)} {...props} />,
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
