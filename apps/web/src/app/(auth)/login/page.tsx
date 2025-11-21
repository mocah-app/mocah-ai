"use client";

import SignInForm from "@/components/authentication/sign-in-form";

export default function LoginPage() {
  return (
    <main className="w-screen h-svh grid items-center justify-center gap-4">
      <div className="flex flex-col items-center justify-center w-full h-full rounded-none p-6">
        <SignInForm />
      </div>
    </main>
  );
}
