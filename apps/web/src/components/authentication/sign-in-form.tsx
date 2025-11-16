"use client";

import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";
import Loader from "../loader";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "../ui/card";
import { cn } from "@/lib/utils";
import EdgeRayLoader from "../EdgeLoader";
import { useState } from "react";
import Image from "next/image";

const autofillStyles =
  "[&:-webkit-autofill]:bg-white [&:-webkit-autofill]:shadow-[0_0_0_30px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:black] [&:-webkit-autofill]:text-black dark:[&:-webkit-autofill]:bg-gray-900 dark:[&:-webkit-autofill]:shadow-[0_0_0_30px_rgb(17_24_39)_inset] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:white] dark:[&:-webkit-autofill]:text-white";

export default function SignInForm() {
  const router = useRouter();
  const { isPending } = authClient.useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await authClient.signIn.email(
          {
            email: value.email,
            password: value.password,
          },
          {
            onSuccess: () => {
              router.push("/dashboard");
              toast.success("Sign in successful");
            },
            onError: (error) => {
              toast.error(error.error.message || error.error.statusText);
            },
          }
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      }),
    },
  });

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  return (
    <Card className="mx-auto w-full max-w-md p-6 rounded-none relative">
      {isSubmitting && <EdgeRayLoader />}

      <div className="flex flex-col items-center justify-center">
        <Image src="/logoipsum.svg" alt="Logo" width={50} height={50} />
      </div>

      <h1 className="mb-2 text-center text-xl md:text-2xl font-semibold">
        Sign In
      </h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4 relative z-10"
      >
        <div>
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  placeholder="Enter your email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className={cn(autofillStyles)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Password</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  placeholder="Enter your password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className={cn(autofillStyles)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe>
          {(state) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!state.canSubmit || state.isSubmitting || isPending}
            >
              {state.isSubmitting || isPending ? (
                <>
                  <Loader />
                </>
              ) : (
                <span>Sign In with Email</span>
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="my-2 flex items-center">
        <div className="flex-1 border-t border-border"></div>
        <span className="px-4 text-sm text-muted-foreground">OR</span>
        <div className="flex-1 border-t border-border"></div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
      >
        <svg
          className="mr-2 h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign In with Google
      </Button>

      <div className="mt-6 space-y-2 text-center">
        <p className="text-sm text-muted-foreground">
          Need help signing in?{" "}
          <Link
            href="/reset-password"
            className="text-primary underline hover:text-primary/80"
          >
            Reset your password
          </Link>
        </p>
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-primary underline hover:text-primary/80"
          >
            Create an account
          </Link>
        </p>
      </div>

      <div className="mt-6 text-center text-xs text-balance text-muted-foreground">
        By using this platform, you are agreeing to our{" "}
        <Link href="/terms" className="underline hover:text-primary/80">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-primary/80">
          Privacy Policy
        </Link>
        .
      </div>
    </Card>
  );
}
