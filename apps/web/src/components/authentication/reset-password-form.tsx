"use client";

import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "../ui/button";
import { FormField } from "./form-field";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import EdgeRayLoader from "../EdgeLoader";
import Loader from "../loader";

interface ResetPasswordFormProps {
  token: string;
  onSuccess: () => void;
}

export function ResetPasswordForm({
  token,
  onSuccess,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      if (value.password !== value.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      setIsSubmitting(true);
      try {
        const { error } = await authClient.resetPassword({
          newPassword: value.password,
          token: token,
        });

        if (error) {
          toast.error(error.message || "Failed to reset password");
          return;
        }

        onSuccess();
        toast.success("Password reset successful!");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } catch (error: any) {
        toast.error(error?.message || "Failed to reset password");
      } finally {
        setIsSubmitting(false);
      }
    },
    validators: {
      onSubmit: z.object({
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string().min(8, "Passwords must match"),
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
          <form.Field name="password">
            {(field) => (
              <FormField
                field={field}
                label="New Password"
                type="password"
                placeholder="Enter your new password"
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
              />
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="confirmPassword">
            {(field) => (
              <FormField
                field={field}
                label="Confirm New Password"
                type="password"
                placeholder="Confirm your new password"
                showPassword={showConfirmPassword}
                onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
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
                <span>Reset Password</span>
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
