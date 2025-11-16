"use client";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import Dashboard from "./dashboard";

export default function DashboardPage() {
  const { data: session } = authClient.useSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col h-full gap-4 p-1 w-full bg-secondary/15">
      <div className="flex bg-background flex-1 flex-col gap-4 p-4 border border-border">
        <Dashboard />
      </div>
    </div>
  );
}
