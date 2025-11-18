import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Loader from "./loader";
import { HelpCircle, Settings, User } from "lucide-react";
import { ModeToggle } from "./mode-toggle";

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
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings" className="w-full justify-start">
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="w-full">
          <ModeToggle />
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              authClient.signOut({
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
