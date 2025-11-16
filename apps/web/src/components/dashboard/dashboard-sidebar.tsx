"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, HelpCircle, LogOut } from "lucide-react";
import { navigationConfig } from "@/config/navigation";
import { cn } from "@/lib/utils";
import UserMenu from "../user-menu";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { state, isMobile, open } = useSidebar();
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-1">
            {!isMobile && <SidebarTrigger className="size-8" />}
            <SidebarMenuButton
              asChild
              className={`data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ${
                state === "collapsed" ? "hidden" : "blockw-fit"
              }`}
            >
              <Button
                variant="outline"
                className="justify-between w-fit flex-1"
              >
                <span className="truncate max-w-38 font-light">
                  {navigationConfig.workspace.name}
                </span>
                <ChevronsUpDown className="size-4" aria-label="More" />
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        {navigationConfig.mainNav.map((section, sectionIndex) => (
          <SidebarGroup key={sectionIndex}>
            {section.title && (
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.links.map((link) => (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(link.href)}
                      tooltip={link.label}
                    >
                      <Link href={link.href as Route}>
                        {link.icon && <link.icon />}
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Favorites */}
        <SidebarGroup>
          <SidebarGroupLabel>
            {navigationConfig.favorites.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationConfig.favorites.links.length === 0 ? (
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  No favorites yet
                </div>
              ) : (
                navigationConfig.favorites.links.map((link) => (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(link.href)}
                      tooltip={link.label}
                    >
                      <Link href={link.href as Route}>
                        {link.icon && <link.icon />}
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Workspace */}
        <SidebarGroup>
          <SidebarGroupLabel>
            {navigationConfig.workspaceNav.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationConfig.workspaceNav.links.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(link.href)}
                    tooltip={link.label}
                  >
                    <Link href={link.href as Route}>
                      {link.icon && <link.icon />}
                      <span>{link.label}</span>
                      {link.badge && (
                        <SidebarMenuBadge>{link.badge}</SidebarMenuBadge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Private */}
        <SidebarGroup>
          <SidebarGroupLabel>
            {navigationConfig.privateNav.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationConfig.privateNav.links.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(link.href)}
                    tooltip={link.label}
                  >
                    <Link href={link.href as Route}>
                      {link.icon && <link.icon />}
                      <span>{link.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <div
            className={cn(
              "flex items-center justify-between gap-1 px-2 transition-all duration-200",
              state === "collapsed" && "flex-col"
            )}
          >
            <SidebarMenuItem className="flex items-center gap-1">
              <Button variant="ghost" asChild>
                <Link href="/help">
                <HelpCircle className="size-4 text-muted-foreground/80" />
                {open && (
                  <span className="truncate max-w-24 font-light">
                    Need help?
                  </span>
                )}
                </Link>
              </Button>
            </SidebarMenuItem>

            <UserMenu />
          </div>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
