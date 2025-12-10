"use client";

import * as motion from "motion/react-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bell, DollarSign, Palette } from "lucide-react";
import { useEffect, useRef } from "react";

// ============================================================================
// Types
// ============================================================================

export type SectionId = "brand" | "notifications" | "billing";

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface SettingsNavProps {
  activeSection: SectionId;
  onNavigate: (sectionId: SectionId) => void;
}

// ============================================================================
// Navigation Config
// ============================================================================

const NAV_ITEMS: NavItem[] = [
  {
    id: "brand",
    label: "Brand",
    icon: Palette,
    description: "Brand settings and preferences",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Notification preferences",
  },
  {
    id: "billing",
    label: "Billing",
    icon: DollarSign,
    description: "Manage your subscription and billing",
  },
];

// ============================================================================
// Component
// ============================================================================

export function SettingsNav({
  activeSection,
  onNavigate,
}: SettingsNavProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navItemRefs = useRef<Record<SectionId, HTMLDivElement | null>>(
    {} as any
  );

  // Auto-scroll active item into view on mobile
  useEffect(() => {
    const activeItem = navItemRefs.current[activeSection];
    const container = scrollContainerRef.current;

    if (activeItem && container && window.innerWidth < 768) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();

      // Check if item is outside visible area
      const isOutOfView =
        itemRect.left < containerRect.left ||
        itemRect.right > containerRect.right;

      if (isOutOfView) {
        activeItem.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeSection]);

  return (
    <div className="w-full md:w-56 border-r bg-secondary/50 flex flex-row md:flex-col shrink-0 overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto md:overflow-x-visible md:overflow-y-auto p-3"
      >
        <nav className="flex md:flex-col gap-3 px-2 pt-2 md:space-y-3 md:space-x-0 md:gap-0 md:pb-2">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.id}
              ref={(el) => {
                navItemRefs.current[item.id] = el;
              }}
            >
              <NavItem
                item={item}
                isActive={activeSection === item.id}
                onClick={() => onNavigate(item.id)}
              />
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ============================================================================
// Nav Item Component
// ============================================================================

function NavItem({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      <Button
        onClick={onClick}
        variant="ghost"
        className={cn(
          "w-auto md:w-full flex items-center gap-3 h-auto rounded-sm text-left md:text-left transition-colors relative shrink-0 min-w-fit md:min-w-0",
          isActive && "bg-background shadow-sm"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors duration-200",
            isActive ? "text-primary" : "text-muted-foreground"
          )}
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm md:text-lg font-medium truncate transition-colors duration-200 whitespace-nowrap",
              isActive ? "text-foreground" : "text-muted-foreground/90"
            )}
          >
            {item.label}
          </p>
        </div>

        {/* Active indicator with layoutId for smooth transitions */}
        {isActive && (
          <motion.div
            className="absolute left-0 md:left-0 top-auto md:top-1/2 md:-translate-y-1/2 bottom-0 md:bottom-auto w-full md:w-0.5 h-0.5 md:h-6 bg-primary rounded-full md:rounded-full"
            layoutId="settingsNavActiveIndicator"
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 30,
            }}
          />
        )}
      </Button>
    </motion.div>
  );
}

export { NAV_ITEMS };
