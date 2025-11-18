import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full">
      <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
      <p className="text-lg text-muted-foreground mt-2">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex items-center justify-center gap-4">
        <Link
          href="/"
          className={buttonVariants({ className: "mt-8", variant: "default" })}
        >
          Return Home
        </Link>
        <Link
          href="/help"
          className={buttonVariants({
            className: "mt-8",
            variant: "secondary",
          })}
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
