import * as React from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & { items?: { label: string; href?: string }[]; separator?: React.ReactNode }
>(({ className, items, separator, ...props }, ref) => {
  if (items) {
    return (
      <nav aria-label="breadcrumb" ref={ref} className={cn("flex items-center text-xs text-muted-foreground", className)} {...props}>
        <ol className="flex flex-wrap items-center gap-1.5 break-words">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={i} className="inline-flex items-center gap-1.5">
                {item.href && !isLast ? (
                  <a href={item.href} className="hover:text-primary transition-colors">{item.label}</a>
                ) : (
                  <span className={cn(isLast && "text-foreground font-semibold")}>{item.label}</span>
                )}
                {!isLast && <ChevronRight className="h-3 w-3 opacity-50" />}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
  return <nav aria-label="breadcrumb" ref={ref} className={cn(className)} {...props} />;
});
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<"li">>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("inline-flex items-center gap-1.5", className)} {...props} />
));
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & { asChild?: boolean }
>(({ asChild, className, ...props }, ref) => <a ref={ref} className={cn("hover:text-primary transition-colors", className)} {...props} />);
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbSeparator = ({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span role="presentation" aria-hidden="true" className={cn("[&>svg]:size-3.5 opacity-50", className)} {...props}>
    {children ?? <ChevronRight />}
  </span>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

const BreadcrumbEllipsis = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span role="presentation" aria-hidden="true" className={cn("flex h-9 w-9 items-center justify-center", className)} {...props}>
    <MoreHorizontal className="h-4 w-4" />
  </span>
);
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";

export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbEllipsis };
