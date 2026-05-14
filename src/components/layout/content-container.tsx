import { cn } from "@/lib/utils";

type ContentContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function ContentContainer({ children, className }: ContentContainerProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8",
        "max-w-[1560px] w-full mx-auto",
        "pb-10 md:pb-12",
        className
      )}
    >
      {children}
    </div>
  );
}
