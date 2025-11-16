"use client";

import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "../ui/button";
import { FormField } from "./form-field";
import Link from "next/link";
import { useState } from "react";
import EdgeRayLoader from "../EdgeLoader";
import Loader from "../loader";

interface ResetPasswordRequestFormProps {
  onEmailSent: () => void;
}

export function ResetPasswordRequestForm({
  onEmailSent,
}: ResetPasswordRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await authClient.requestPasswordReset({
          email: value.email,
          redirectTo: `${window.location.origin}/reset-password`,
        });
        onEmailSent();
        toast.success("Password reset email sent! Check your inbox.");
      } catch (error: any) {
        toast.error(error?.message || "Failed to send reset email");
      } finally {
        setIsSubmitting(false);
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
      }),
    },
  });

  return (
    <>
      {isSubmitting && <EdgeRayLoader />}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <div>
          <form.Field name="email">
            {(field) => (
              <FormField
                field={field}
                label="Email"
                type="email"
                placeholder="Enter your email"
              />
            )}
          </form.Field>
        </div>

        <form.Subscribe>
          {(state) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? (
                <>
                  <Loader />
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-6 text-center">
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
