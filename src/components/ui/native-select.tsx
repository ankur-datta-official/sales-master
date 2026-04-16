import * as React from "react";

import { cn } from "@/lib/utils";

type NativeSelectProps = React.ComponentProps<"select"> & {
  uiSize?: "sm" | "md";
};

export function NativeSelect({
  className,
  uiSize = "md",
  ...props
}: NativeSelectProps) {
  return (
    <select
      data-slot="native-select"
      data-size={uiSize}
      className={cn(
        "flex w-full min-w-0 rounded-xl border border-input bg-background/50 px-3 text-sm",
        "shadow-[var(--shadow-xs)] outline-none transition-[background-color,border-color,box-shadow]",
        "focus-visible:bg-background/70",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:disabled:bg-input/80",
        "data-[size=sm]:h-7 data-[size=sm]:text-[0.8rem]",
        "data-[size=md]:h-9",
        className
      )}
      {...props}
    />
  );
}

