import { BookOpenText, DollarSign, LayoutGrid, Settings2, type LucideIcon } from "lucide-react";
import type { Route } from "next";

export type NavLink = {
  label: string;
  href: Route | string; // Route for existing routes, string for mock/future routes
  icon?: LucideIcon;
  badge?: string | number;
};

export type NavSection = {
  title?: string;
  links: NavLink[];
};

// Mock navigation data - easily editable
export const navigationConfig: {
  mainNav: NavSection[];
  privateNav: NavSection;
} = {
  mainNav: [
    {
      title: "Workspace",
      links: [
        {
          label: "Templates",
          href: "/dashboard",
          icon: LayoutGrid,
        },
        {
          label: "Library",
          href: "/library",
          icon: BookOpenText,
        },
      ],
    },
  ],


  privateNav: {
    title: "Account",
    links: [
      {
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings2,
      },
      {
        label: "Billing",
        href: "/dashboard/billing",
        icon: DollarSign,
      }
    ],
  },
};
