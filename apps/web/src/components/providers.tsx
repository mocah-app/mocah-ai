"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient, trpc, trpcClient } from "@/utils/trpc";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import { SidebarProvider } from "./ui/sidebar";
import { OrganizationProvider } from "@/contexts/organization-context";
import { UpgradeModalProvider } from "@/contexts/upgrade-modal-context";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [trpcClientInstance] = useState(() => trpcClient);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider>
        <trpc.Provider client={trpcClientInstance} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <OrganizationProvider>
              <UpgradeModalProvider>
                {children}
                <ReactQueryDevtools />
              </UpgradeModalProvider>
            </OrganizationProvider>
          </QueryClientProvider>
        </trpc.Provider>
        <Toaster richColors />
      </SidebarProvider>
    </ThemeProvider>
  );
}
