import { cn } from "@/lib/utils";

type ContentContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function ContentContainer({ children, className }: ContentContainerProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-4 md:px-5 md:pb-10 md:pt-5 lg:px-6 lg:pt-6",
        "max-w-[1580px] w-full mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
}
