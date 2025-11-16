"use client";

import SignUpForm from "@/components/authentication/sign-up-form";

export default function RegisterPage() {
  return (
    <main className="w-screen h-svh grid md:grid-cols-2 items-center justify-center gap-4">
      <div className="flex flex-col items-center justify-center w-full h-full rounded-none p-6">
        <SignUpForm />
      </div>
      <div className="w-full bg-card min-h-full hidden md:flex items-center justify-center">
        <span className="text-4xl text-muted-foreground">Image here</span>
      </div>
    </main>
  );
}
