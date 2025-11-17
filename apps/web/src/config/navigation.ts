import {
  Globe,
  LayoutGrid,
  Trash2,
  Settings,
  HelpCircle,
  Share2,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
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
  workspace: {
    name: string;
    memberCount: number;
  };
  mainNav: NavSection[];
  favorites: NavSection;
  workspaceNav: NavSection;
  privateNav: NavSection;
  footerActions: NavLink[];
} = {
  workspace: {
    name: "Mocah workspace",
    memberCount: 1,
  },
  mainNav: [
    {
      links: [
        {
          label: "Shared with me",
          href: "/dashboard/shared",
          icon: Share2,
        },
        {
          label: "Community",
          href: "/community",
          icon: Globe,
        },
      ],
    },
  ],
  favorites: {
    title: "Favorites",
    links: [],
  },
  workspaceNav: {
    title: "Workspace",
    links: [
      {
        label: "All",
        href: "/dashboard",
        icon: LayoutGrid,
        badge: 481,
      },
    ],
  },
  privateNav: {
    title: "Private",
    links: [
      {
        label: "All",
        href: "/dashboard/private",
        icon: LayoutGrid,
      },
    ],
  },
  footerActions: [
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
    {
      label: "Help",
      href: "/dashboard/help",
      icon: HelpCircle,
    },
  ],
};
