"use client";
import { cn } from "@/lib/utils";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import MocahLogo from "../mocah-brand/MocahLogo";

export default function PublicHeader() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/library", label: "Library" },
    { to: "/pricing", label: "Pricing" },
  ] as const;
  const pathname = usePathname();
  const isActive = (href: string) => {
    return pathname === href;
  };
  return (
    <header className="w-full p-4">
      <div className="flex flex-row items-center justify-between max-w-7xl mx-auto">
        {/* Logo on the left */}
        <Link href="/" className="flex items-center">
          <MocahLogo className="h-12 w-auto" />
        </Link>

        {/* Navigation links in the center */}
        <div className="flex flex-1 flex-row items-start rounded-full">
          {links.map(({ to, label }) => (
            <Button
              asChild
              key={to}
              variant="ghost"
              size="sm"
              className={cn(isActive(to) && "bg-secondary/20 text-secondary-foreground", "text-muted-foreground text-base")}
            >
              <Link href={to as Route} aria-label={label}>
                {label}
              </Link>
            </Button>
          ))}
        </div>

        {/* Sign In and Get Started buttons on the right */}
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" >
            <Link href={"/login"} aria-label="Sign In">
              Sign In
            </Link>
          </Button>
          <Button asChild>
            <Link href={"/register"} aria-label="Get Started">
              Get Started
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
