"use client";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { navigationConfig, type NavLink } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { HelpCircle } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "../user-menu";
import { WorkspaceSwitcher } from "../workspace-switcher";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { state, isMobile, open } = useSidebar();

  // Check if user can publish to library
  const { data: canPublish } = trpc.template.library.canPublish.useQuery();

  const isActive = (href: string) => {
    if (href === "/app") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Filter links based on publisher permission
  const filterLinks = (links: NavLink[]) => {
    return links.filter(link => {
      if (link.requiresPublisher && !canPublish) {
        return false;
      }
      return true;
    });
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
              <div className="flex justify-center">
          <WorkspaceSwitcher />
        </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        {navigationConfig.mainNav.map((section, sectionIndex) => {
          const filteredLinks = filterLinks(section.links);
          if (filteredLinks.length === 0) return null;

          return (
            <SidebarGroup key={sectionIndex}>
              {section.title && (
                <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredLinks.map((link) => (
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
          );
        })}

        {/* Collection Navigation */}
        {(() => {
          const filteredLinks = filterLinks(navigationConfig.collectionNav.links);
          if (filteredLinks.length === 0) return null;

          return (
            <SidebarGroup>
              <SidebarGroupLabel>
                {navigationConfig.collectionNav.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredLinks.map((link) => (
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
          );
        })()}

        {/* Private */}
        {(() => {
          const filteredLinks = filterLinks(navigationConfig.privateNav.links);
          if (filteredLinks.length === 0) return null;

          return (
            <SidebarGroup>
              <SidebarGroupLabel>
                {navigationConfig.privateNav.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredLinks.map((link) => (
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
          );
        })()}
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
