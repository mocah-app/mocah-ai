"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function Header() {
  const links = [{ to: "/dashboard", label: "Dashboard" }] as const;

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1 bg-sidebar">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <nav className="flex gap-4 text-lg">
            {links.map(({ to, label }) => {
              return (
                <Link key={to} href={to}>
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Search template..."
            className="w-64 bg-background"
          />
          <Button>
            New Template <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <hr />
    </div>
  );
}
