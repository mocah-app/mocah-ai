import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import DashboardHeader from "@/components/dashboardHeader";
import { BrandConfigurationModal } from "@/components/brand-kit/brand-configuration-modal";
import { SettingsModal } from "@/components/settings/settings-modal";
import { Suspense } from "react";

export default function DashboardWithSidebarLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-svh w-full">
      <DashboardSidebar />
      <SidebarInset>
        <div className="flex flex-col h-full">
          <DashboardHeader />
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </SidebarInset>
      {/* Brand Configuration Modal - triggered by URL param */}
      <Suspense fallback={null}>
        <BrandConfigurationModal />
      </Suspense>
      {/* Settings Modal - triggered by URL param */}
      <Suspense fallback={null}>
        <SettingsModal />
      </Suspense>
    </div>
  );
}
