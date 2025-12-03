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
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "./ui/skeleton";
import Link from "next/link";
import Loader from "./loader";

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
        <Loader />
        <Skeleton className="w-[200px] h-10" />
      </Button>
    );
  }

  // Show first organization if we have orgs but no active one set yet (during loading)
  const displayOrg = activeOrganization || (organizations.length > 0 ? organizations[0] : null);

  if (!displayOrg && organizations.length === 0) {
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
    organizationId: displayOrg?.id,
    organizationName: displayOrg?.name,
    hasLogo: !!displayOrg?.logo,
    isActiveOrg: !!activeOrganization,
    isFallback: !activeOrganization && !!displayOrg,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          <span className="truncate flex items-center gap-2">
            <Avatar className="size-4">
              <AvatarImage src={displayOrg?.logo || undefined} className="object-contain" />
              <AvatarFallback>
                {displayOrg?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {displayOrg?.name || "Select Workspace"}
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
              displayOrg?.id === org.id ? "border-primary border" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              {org.logo && (
                <Avatar className="size-4">
                  <AvatarImage src={org.logo || undefined} className="object-contain" />
                  <AvatarFallback>{org.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <span className="truncate">{org.name}</span>
            </div>
            {displayOrg?.id === org.id && (
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
