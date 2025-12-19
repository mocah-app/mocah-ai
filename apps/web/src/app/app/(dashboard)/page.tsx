"use client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Dashboard from "./dashboard";
import MocahLoadingIcon from "@/components/mocah-brand/MocahLoadingIcon";

export default function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-full h-full">
        <MocahLoadingIcon isLoading={true} size="sm" />
      </div>
    );
  }

  return (
    <div className="p-1 w-full">
      <div className="py-4 border border-border">
        <Dashboard />
      </div>
    </div>
  );
}
