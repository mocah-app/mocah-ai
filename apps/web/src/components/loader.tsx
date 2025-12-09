import { Loader as LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export default function Loader({
  size = "md",
  className,
}: LoaderProps) {
  return (
    <div className={cn("flex h-full items-center justify-center", className)}>
      <LoaderIcon
        className={cn(
          "animate-spin",
          size === "xs" && "size-4",
          size === "sm" && "size-5",
          size === "md" && "size-6",
          size === "lg" && "size-7"
        )}
      />
    </div>
  );
}
