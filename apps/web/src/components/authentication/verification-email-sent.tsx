"use client";

import { Button } from "../ui/button";
import Link from "next/link";

interface VerificationEmailSentProps {
  email: string;
  onResend: () => void;
  isResending?: boolean;
}

export function VerificationEmailSent({
  email,
  onResend,
  isResending = false,
}: VerificationEmailSentProps) {
  return (
    <>
      <p className="mb-6 text-center text-muted-foreground">
        We've sent a verification link to <strong>{email}</strong>. Please check
        your inbox and click the link to verify your account.
      </p>
      <Button
        className="w-full"
        variant="outline"
        onClick={onResend}
        disabled={isResending}
      >
        {isResending ? "Resending..." : "Resend Verification Email"}
      </Button>
      <div className="mt-4 text-center">
        <Link
          href="/login"
          className="text-sm text-primary underline hover:text-primary/80"
        >
          Back to Sign In
        </Link>
      </div>
    </>
  );
}

