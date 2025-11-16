import { auth } from "@mocah/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Dashboard from "./dashboard";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col h-full gap-4 p-1 pr-0 pb-0 w-full bg-sidebar">
      <div className="flex bg-background flex-1 flex-col gap-4 p-4 rounded-tl-3xl border border-border">
        <Dashboard session={session} />
      </div>
    </div>
  );
}
