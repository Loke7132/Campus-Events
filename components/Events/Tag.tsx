import { cn } from "@/lib/utils";

interface TagProps {
  children: React.ReactNode;
  className?: string;
}

export const Tag = ({ children, className }: TagProps) => (
  <div 
    className={cn(
      "flex items-center gap-1 min-[360px]:gap-2 bg-zinc-700/50 px-2.5 py-1.5 rounded-lg shrink-0 shadow-sm",
      className
    )}
  >
    {children}
  </div>
);
