"use client";

import { useOrganization } from "@/contexts/organization-context";
import { logger } from "@mocah/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "./ui/skeleton";
import Link from "next/link";

export function WorkspaceSwitcher() {
  const router = useRouter();
  const {
    activeOrganization,
    organizations,
    setActiveOrganization,
    isLoading,
  } = useOrganization();

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="w-[200px]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <Skeleton className="w-[200px] h-10" />
      </Button>
    );
  }

  if (!activeOrganization && organizations.length === 0) {
    return (
      <Button
        variant="outline"
        onClick={() => router.push("/brand-setup")}
        className="w-[200px]"
      >
        <Plus className="mr-2 h-4 w-4" />
        Create Workspace
      </Button>
    );
  }

  logger.debug("Active organization state", {
    component: "WorkspaceSwitcher",
    organizationId: activeOrganization?.id,
    organizationName: activeOrganization?.name,
    hasLogo: !!activeOrganization?.logo,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          <span className="truncate flex items-center gap-2">
            <Avatar className="size-4">
              <AvatarImage src={activeOrganization?.logo || undefined} />
              <AvatarFallback>
                {activeOrganization?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {activeOrganization?.name || "Select Workspace"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuLabel>Brands</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => setActiveOrganization(org.id)}
            className={`cursor-pointer flex items-center justify-between gap-1 ${
              activeOrganization?.id === org.id ? "border-primary border" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              {org.logo && (
                <Avatar className="size-4">
                  <AvatarImage src={org.logo || undefined} />
                  <AvatarFallback>{org.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <span className="truncate">{org.name}</span>
            </div>
            {activeOrganization?.id === org.id && (
              <Check className="ml-2 h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href="/brand-setup">
            <Plus className="mr-2 h-4 w-4" />
            Create New Brand
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
