"use client";

import { Button } from "../ui/button";
import Link from "next/link";

interface EmailSentConfirmationProps {
  onResend: () => void;
}

export function EmailSentConfirmation({ onResend }: EmailSentConfirmationProps) {
  return (
    <>
      <p className="mb-6 text-center text-muted-foreground">
        We've sent a password reset link to your email address. Please check
        your inbox and click the link to reset your password.
      </p>
      <Button className="w-full" variant="outline" onClick={onResend}>
        Resend Email
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

