"use client";

import SignInForm from "@/components/authentication/sign-in-form";

export default function LoginPage() {
  return (
    <div className="grid md:grid-cols-2 h-full items-center justify-center gap-4">
      <div className="flex flex-col items-center justify-center w-full h-full rounded-none p-6">
        <SignInForm />
      </div>
      <div className="w-full bg-card min-h-full hidden md:flex items-center justify-center">
        <span className="text-4xl text-muted-foreground">Image here</span>
      </div>
    </div>
  );
}
