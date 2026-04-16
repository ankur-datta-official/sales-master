"use client";

import { useFormStatus } from "react-dom";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  idleText?: string;
  pendingText?: string;
};

export function ApplyFiltersButton({
  className,
  idleText = "Apply",
  pendingText = "Applying...",
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonVariants({ variant: "outline" }), className ?? "h-9 px-4")}
    >
      {pending ? pendingText : idleText}
    </button>
  );
}
