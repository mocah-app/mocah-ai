"use client";

import type { Variants } from "motion/react";
import { stagger } from "motion/react";
import * as motion from "motion/react-client";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import * as React from "react";
import { cn } from "@/lib/utils";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import MocahLogo from "../mocah-brand/MocahLogo";
import MenuActions from "./MenuActions";

const links = [
  { to: "/", label: "Home" },
  { to: "/library", label: "Library" },
  { to: "/pricing", label: "Pricing" },
] as const;

// Animation timing constants - adjust these to control menu animation speed
const MENU_ANIMATION = {
  // Sidebar (menu background) expansion animation
  sidebar: {
    open: {
      type: "spring" as const,
      stiffness: 15,
      restDelta: 2,
    },
    closed: {
      delay: 0.3,
      type: "spring" as const,
      stiffness: 300,
      damping: 50,
    },
  },
  // Menu items container stagger timing
  stagger: {
    open: {
      delay: 0.1,
      startDelay: 0.3,
    },
    closed: {
      delay: 0.08,
      from: "last" as const,
    },
  },
  // Individual menu item animation
  item: {
    open: {
      stiffness: 600,
      velocity: -100,
    },
    closed: {
      stiffness: 600,
    },
  },
  // Hamburger icon path animation
  icon: {
    duration: 0.2,
  },
} as const;

const useDimensions = (
  ref: React.RefObject<HTMLDivElement | null>,
  isOpen: boolean
) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const updateDimensions = React.useCallback(() => {
    if (ref.current) {
      setDimensions({
        width: ref.current.offsetWidth,
        height: ref.current.offsetHeight,
      });
    }
  }, [ref]);

  useLayoutEffect(() => {
    updateDimensions();
  }, [updateDimensions, isOpen]);

  useEffect(() => {
    const handleResize = () => {
      updateDimensions();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateDimensions]);

  return dimensions;
};

const sidebarVariants: Variants = {
  open: (height = 1000) => ({
    clipPath: `circle(${height * 2 + 200}px at calc(100% - 40px) 40px)`,
    transition: MENU_ANIMATION.sidebar.open,
  }),
  closed: {
    clipPath: "circle(30px at calc(100% - 40px) 40px)",
    transition: MENU_ANIMATION.sidebar.closed,
  },
};

const navVariants: Variants = {
  open: {
    transition: {
      delayChildren: stagger(MENU_ANIMATION.stagger.open.delay, {
        startDelay: MENU_ANIMATION.stagger.open.startDelay,
      }),
    },
  },
  closed: {
    transition: {
      delayChildren: stagger(MENU_ANIMATION.stagger.closed.delay, {
        from: MENU_ANIMATION.stagger.closed.from,
      }),
    },
  },
};

const itemVariants: Variants = {
  open: {
    y: 0,
    opacity: 1,
    transition: {
      y: MENU_ANIMATION.item.open,
    },
  },
  closed: {
    y: 50,
    opacity: 0,
    transition: {
      y: MENU_ANIMATION.item.closed,
    },
  },
};

interface PathProps {
  d?: string;
  variants: Variants;
  transition?: { duration: number };
}

const Path = (props: PathProps) => (
  <motion.path
    fill="transparent"
    strokeWidth="3"
    stroke="currentColor"
    strokeLinecap="round"
    {...props}
  />
);

export default function PublicHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { height } = useDimensions(containerRef, isMenuOpen);

  const isActive = (href: string) => pathname === href;

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Prevent hydration mismatch by tracking mount state
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="w-full p-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center z-50">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <MocahLogo className="h-12 w-auto" />
          </motion.div>
        </Link>

        {/* Desktop Navigation - hidden on mobile via CSS */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to} label={label} isActive={isActive(to)} />
          ))}
        </nav>

        {/* Desktop Auth Buttons - hidden on mobile via CSS */}
        <div className="hidden md:block">
          <MenuActions variant="desktop" />
        </div>

        {/* Mobile Menu Button - visible on mobile via CSS */}
        {mounted && (
          <motion.button
            className="md:hidden z-80 outline-none border-none select-none cursor-pointer w-[50px] h-[50px] rounded-full bg-accent flex items-center justify-center"
            onClick={toggleMenu}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle menu"
          >
            <motion.svg
              width="23"
              height="23"
              viewBox="0 0 23 23"
              className="text-foreground"
              initial={false}
              animate={isMenuOpen ? "open" : "closed"}
            >
              <Path
                variants={{
                  closed: { d: "M 2 2.5 L 20 2.5" },
                  open: { d: "M 3 16.5 L 17 2.5" },
                }}
              />
              <Path
                d="M 2 9.423 L 20 9.423"
                variants={{
                  closed: { opacity: 1 },
                  open: { opacity: 0 },
                }}
                transition={{ duration: MENU_ANIMATION.icon.duration }}
              />
              <Path
                variants={{
                  closed: { d: "M 2 16.346 L 20 16.346" },
                  open: { d: "M 3 2.5 L 17 16.346" },
                }}
              />
            </motion.svg>
          </motion.button>
        )}

        {/* Mobile Menu */}
        {mounted && (
          <motion.nav
            initial={false}
            animate={isMenuOpen ? "open" : "closed"}
            custom={height}
            ref={containerRef}
            className="md:hidden fixed top-0 right-0 bottom-0 w-80 z-50 pointer-events-none"
            style={{ pointerEvents: isMenuOpen ? "auto" : "none" }}
          >
            <motion.div
              className="absolute inset-0 bg-accent"
              variants={sidebarVariants}
            />
            <motion.ul
              className="absolute top-20 right-6 flex flex-col gap-5 list-none p-0 m-0 w-[calc(100%-3rem)]"
              variants={navVariants}
            >
              {links.map(({ to, label }) => (
                <motion.li
                  key={to}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    asChild
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-2xl",
                      isActive(to) &&
                        "bg-secondary dark:bg-card text-secondary-foreground"
                    )}
                    onClick={closeMenu}
                  >
                    <Link href={to as Route}>{label}</Link>
                  </Button>
                </motion.li>
              ))}
              <motion.li
                variants={itemVariants}
                className="pt-4 border-t"
              >
                <MenuActions variant="mobile" onActionClick={closeMenu} />
              </motion.li>
            </motion.ul>
          </motion.nav>
        )}
      </div>
    </header>
  );
}

function NavLink({
  to,
  label,
  isActive,
}: {
  to: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        asChild
        variant="ghost"
        size="sm"
        className={cn(
          "text-base relative",
          isActive && "bg-secondary/20 text-secondary-foreground"
        )}
      >
        <Link href={to as Route} aria-label={label}>
          {label}
          {isActive && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
              layoutId="activeTab"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </Link>
      </Button>
    </motion.div>
  );
}
