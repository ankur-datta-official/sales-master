import { cn } from "@/lib/utils";

type ContentContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function ContentContainer({ children, className }: ContentContainerProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-4 p-4 md:p-6",
        "max-w-[1600px] w-full mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
}
