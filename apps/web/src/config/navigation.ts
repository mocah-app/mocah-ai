import { BookmarkCheck, BookOpenText, Globe, LayoutGrid, Repeat2, Settings2, Star, type LucideIcon } from "lucide-react";
import type { Route } from "next";

export type NavLink = {
  label: string;
  href: Route | string; // Route for existing routes, string for mock/future routes
  icon?: LucideIcon;
  badge?: string | number;
  requiresPublisher?: boolean; // Flag for conditional rendering
};

export type NavSection = {
  title?: string;
  links: NavLink[];
};

// Mock navigation data - easily editable
export const navigationConfig: {
  mainNav: NavSection[];
  privateNav: NavSection;
  collectionNav: NavSection;
} = {
  mainNav: [
    {
      title: "Email",
      links: [
        {
          label: "Templates",
          href: "/app",
          icon: LayoutGrid,
        },
        // {
        //   label: "Templates",
        //   href: "/app/published",
        //   icon: Globe,
        //   requiresPublisher: true,
        // },
       
      ],
    },
  ],

  collectionNav: {
    title: "Collections",
    links: [
      {
        label: "Library",
        href: "/library",
        icon: BookOpenText,
      },
      {
        label: "Published",
        href: "/app/published",
        icon: Repeat2,
        requiresPublisher: true,
      },
    ],
  },

  privateNav: {
    title: "Brand",
    links: [
      {
        label: "Configuration",
        href: "/app/?brand=configuration",
        icon: Settings2,
      },
    ],
  },
};
