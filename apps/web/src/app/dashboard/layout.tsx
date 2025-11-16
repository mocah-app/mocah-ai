import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import DashboardHeader from "@/components/dashboardHeader";

export default function DashboardLayout({
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
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </SidebarInset>
    </div>
  );
}
