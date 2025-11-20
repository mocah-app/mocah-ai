"use client";

import * as motion from "motion/react-client";
import { authClient } from "@/lib/auth-client";
import { Button } from "../ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MenuActionsProps {
  variant?: "desktop" | "mobile";
  onActionClick?: () => void;
}

export default function MenuActions({
  variant = "desktop",
  onActionClick,
}: MenuActionsProps) {
  const { data: session, isPending } = authClient.useSession();

  // Prevent layout shift - maintain consistent width for desktop
  const wrapperClass = variant === "mobile" 
    ? "" 
    : "w-[200px] flex justify-end";
  
  const containerClass = variant === "mobile" 
    ? "flex flex-col gap-2" 
    : "flex items-center gap-2";

  if (isPending) {
    return (
      <div className={wrapperClass}>
        <div className={containerClass}>
          <motion.div
            className={cn(
              "h-9 rounded-full bg-muted animate-pulse",
              variant === "mobile" ? "w-full" : "w-20"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className={cn(
              "h-9 rounded-full bg-muted animate-pulse",
              variant === "mobile" ? "w-full" : "w-24"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          />
        </div>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className={wrapperClass}>
        <motion.div
          className={containerClass}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            asChild
            className={cn(variant === "mobile" && "w-full")}
            onClick={onActionClick}
          >
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <motion.div
        className={containerClass}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          asChild
          variant="outline"
          className={cn(variant === "mobile" && "w-full")}
          onClick={onActionClick}
        >
          <Link href="/login">Sign In</Link>
        </Button>
        <Button
          asChild
          className={cn(variant === "mobile" && "w-full")}
          onClick={onActionClick}
        >
          <Link href="/register">Get Started</Link>
        </Button>
      </motion.div>
    </div>
  );
}

