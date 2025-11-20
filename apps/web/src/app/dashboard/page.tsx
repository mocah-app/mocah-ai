"use client";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import Dashboard from "./dashboard";
import MocahLoadingIcon from "@/components/mocah-brand/MocahLoadingIcon";

export default function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      redirect("/login");
    }
  }, [session, isPending]);

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-full h-full">
        <MocahLoadingIcon isLoading={true} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col h-full gap-4 p-1 w-full">
      <div className="flex flex-1 flex-col gap-4 p-4 border border-border">
        <Dashboard />
      </div>
    </div>
  );
}
