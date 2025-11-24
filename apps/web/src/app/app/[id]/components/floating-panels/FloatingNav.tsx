import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Download, FileSliders, History, LibraryBig, MessageCircle } from "lucide-react";

interface FloatingNavProps {
  activePanel: string | null;
  onTogglePanel: (panel: string) => void;
}

const NAV_ITEMS = [
  { id: "chat", icon: MessageCircle, label: "Chat" },
  { id: "editor", icon: FileSliders, label: "Editor" },
  { id: "library", icon: LibraryBig, label: "Library" },
  { id: "versions", icon: History, label: "Versions" },
  { id: "export", icon: Download, label: "Export" },
] as const;

export const FloatingNav = ({
  activePanel,
  onTogglePanel,
}: FloatingNavProps) => {
  return (
    <TooltipProvider delayDuration={300}>
      <nav className="bg-card shadow-lg border p-2 flex flex-col gap-1 z-50 h-dvh pt-8">
        {NAV_ITEMS.map((item) => {
          const isActive = activePanel === item.id;
          const Icon = item.icon;

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="icon"
                  onClick={() => onTogglePanel(item.id)}
                  className={cn(
                    "h-10 w-10 rounded-xl transition-colors",
                    isActive && "shadow-md"
                  )}
                  aria-label={item.label}
                  aria-pressed={isActive}
                >
                  <Icon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
};