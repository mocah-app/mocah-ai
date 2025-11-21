"use client";

import SignUpForm from "@/components/authentication/sign-up-form";

export default function RegisterPage() {
  return (
    <main className="w-screen h-svh grid items-center justify-center gap-4">
      <div className="flex flex-col items-center justify-center w-full h-full rounded-none p-6">
        <SignUpForm />
      </div>
    </main>
  );
}
