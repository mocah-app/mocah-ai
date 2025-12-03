"use client";

import * as motion from "motion/react-client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Building2,
  FileText,
  Globe,
  Heart,
  Package,
  Palette,
  Share2,
  Sparkles,
  Type,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type SectionId =
  | "identity"
  | "colors"
  | "typography"
  | "personality"
  | "company"
  | "social"
  | "products"
  | "values"
  | "ai-data";

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface BrandConfigNavProps {
  activeSection: SectionId;
  onNavigate: (sectionId: SectionId) => void;
}

// ============================================================================
// Navigation Config
// ============================================================================

const NAV_ITEMS: NavItem[] = [
  {
    id: "identity",
    label: "Identity",
    icon: Building2,
    description: "Name, logo, and tagline",
  },
  {
    id: "colors",
    label: "Colors",
    icon: Palette,
    description: "Brand color palette",
  },
  {
    id: "typography",
    label: "Typography",
    icon: Type,
    description: "Fonts and styling",
  },
  {
    id: "personality",
    label: "Personality",
    icon: Sparkles,
    description: "Voice, tone, and energy",
  },
  {
    id: "company",
    label: "Company",
    icon: Globe,
    description: "Business details",
  },
  {
    id: "social",
    label: "Social Links",
    icon: Share2,
    description: "Social media profiles",
  },
  {
    id: "products",
    label: "Products",
    icon: Package,
    description: "Products & services",
  },
  {
    id: "values",
    label: "Values",
    icon: Heart,
    description: "Brand values",
  },
  {
    id: "ai-data",
    label: "AI Data",
    icon: FileText,
    description: "Scraped content",
  },
];

// ============================================================================
// Component
// ============================================================================

export function BrandConfigNav({
  activeSection,
  onNavigate,
}: BrandConfigNavProps) {
  return (
    <div className="w-56 border-r bg-secondary/50 flex flex-col shrink-0">
      <ScrollArea className="flex-1 p-3">
        <nav className="space-y-3 px-2 pt-2">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeSection === item.id}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </nav>
      </ScrollArea>
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
          "w-full flex items-center gap-3 h-auto rounded-sm text-left transition-colors relative",
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
              "text-lg font-medium truncate transition-colors duration-200",
              isActive ? "text-foreground" : "text-muted-foreground/90"
            )}
          >
            {item.label}
          </p>
        </div>

        {/* Active indicator with layoutId for smooth transitions */}
        {isActive && (
          <motion.div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-full"
            layoutId="brandNavActiveIndicator"
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

