import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";
import { Bell, DollarSign, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Loader from "./loader";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";

export default function UserMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Loader />;
  }

  if (!session) {
    return (
      <Button variant="outline" asChild>
        <Link href="/login">Sign In</Link>
      </Button>
    );
  }

  // stripeCustomerId exists in DB but isn't in Better Auth's inferred session type
  const stripeCustomerId = (session.user as { stripeCustomerId?: string | null }).stripeCustomerId;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="">
        <Button variant="outline" size="icon">
          <User className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card space-y-2 min-w-42">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span>My Account</span>
          <span className="text-xs text-muted-foreground/70">
            {session.user.email}
          </span>
          {stripeCustomerId && (
            <span className="text-xs text-muted-foreground/70">
              {stripeCustomerId}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app?settings=open" className="w-full justify-start">
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/app?settings=open&tab=billing" className="w-full justify-start">
            <DollarSign className="size-4" />
            Billing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app?settings=open&tab=notifications" className="w-full justify-start">
            <Bell className="size-4" />
            Notifications
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="w-full">
          <ModeToggle />
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Button
            variant="destructive"
            className="w-full"
            onClick={async () => {
              // Clear all cached queries to prevent stale data on next login
              queryClient.clear();
              
              await authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push("/");
                  },
                },
              });
            }}
          >
            Sign Out
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
