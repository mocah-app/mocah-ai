"use client";
import { cn } from "@/lib/utils";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";

export default function PublicHeader() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/pricing", label: "Pricing" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ] as const;
  const pathname = usePathname();
  const isActive = (href: string) => {
    return pathname === href;
  };
  return (
    <header className="w-full p-1">
      <div className="flex flex-row items-center rounded-full justify-center max-w-md mx-auto p-2 bg-secondary/15">
        {links.map(({ to, label }) => (
          <Button
            asChild
            key={to}
            variant="ghost"
            size="sm"
            className={cn(isActive(to) && "bg-secondary/20 text-secondary-foreground", "text-muted-foreground")}
          >
            <Link href={to as Route} aria-label={label}>
              {label}
            </Link>
          </Button>
        ))}
      </div>
    </header>
  );
}
