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
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, HelpCircle, LogOut } from "lucide-react";
import { navigationConfig } from "@/config/navigation";
import { cn } from "@/lib/utils";
import UserMenu from "../user-menu";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { state, open } = useSidebar();
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
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="text-sm font-semibold">
                    {navigationConfig.workspace.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {navigationConfig.workspace.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {navigationConfig.workspace.memberCount} Member
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto size-7">
                  <ChevronsUpDown className="size-4" />
                  <span className="sr-only">More</span>
                </Button>
              </Link>
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
              <Button variant="ghost">
                <HelpCircle className="size-4 text-muted-foreground/80" />
                Need help?
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
