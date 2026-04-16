import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SectionCardProps = React.ComponentProps<typeof Card> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  contentClassName?: string;
};

export function SectionCard({
  title,
  description,
  actions,
  contentClassName,
  className,
  children,
  ...props
}: SectionCardProps) {
  return (
    <Card
      className={cn(
        "ring-foreground/10 bg-card/85",
        "shadow-[var(--shadow-md)]",
        className
      )}
      {...props}
    >
      {(title || description || actions) && (
        <CardHeader className={cn(actions ? "grid-cols-[1fr_auto]" : undefined)}>
          <div className="min-w-0">
            {title ? <CardTitle className="truncate">{title}</CardTitle> : null}
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {actions ? <div className="self-start">{actions}</div> : null}
        </CardHeader>
      )}
      <CardContent className={cn("space-y-4", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

