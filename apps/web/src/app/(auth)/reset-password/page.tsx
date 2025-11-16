"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/authentication/auth-card";
import { ResetPasswordRequestForm } from "@/components/authentication/reset-password-request-form";
import { ResetPasswordForm } from "@/components/authentication/reset-password-form";
import { ResetPasswordSuccess } from "@/components/authentication/reset-password-success";
import { EmailSentConfirmation } from "@/components/authentication/email-sent-confirmation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [emailSent, setEmailSent] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  // If token is present, show reset form
  if (token) {
    if (passwordReset) {
      return (
        <AuthCard title="Password Reset Successful">
          <ResetPasswordSuccess />
        </AuthCard>
      );
    }

    return (
      <AuthCard title="Reset Your Password">
        <ResetPasswordForm
          token={token}
          onSuccess={() => setPasswordReset(true)}
        />
      </AuthCard>
    );
  }

  // Show email sent confirmation
  if (emailSent) {
    return (
      <AuthCard title="Check Your Email">
        <EmailSentConfirmation onResend={() => setEmailSent(false)} />
      </AuthCard>
    );
  }

  // Show email request form
  return (
    <AuthCard
      title="Reset Your Password"
      description="Enter your email address and we'll send you a link to reset your password."
    >
      <ResetPasswordRequestForm onEmailSent={() => setEmailSent(true)} />
    </AuthCard>
  );
}
