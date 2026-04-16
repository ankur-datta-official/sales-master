import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RowActionLink({
  href,
  children = "View",
  className,
}: {
  href: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "h-8 rounded-lg px-2.5 ring-1 ring-transparent",
        "hover:bg-muted/40 hover:ring-border/70",
        "focus-visible:ring-border/70",
        className
      )}
    >
      {children}
    </Link>
  );
}

