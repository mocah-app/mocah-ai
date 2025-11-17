"use client";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import Dashboard from "./dashboard";

export default function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      redirect("/login");
    }
  }, [session, isPending]);

  return (
    <div className="flex flex-1 flex-col h-full gap-4 p-1 w-full bg-secondary/15">
      <div className="flex bg-background flex-1 flex-col gap-4 p-4 border border-border">
        <Dashboard />
      </div>
    </div>
  );
}
