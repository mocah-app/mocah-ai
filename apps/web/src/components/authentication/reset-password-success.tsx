"use client";

import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

export function ResetPasswordSuccess() {
  const router = useRouter();

  return (
    <>
      <p className="mb-6 text-center text-gray-600">
        Your password has been reset. Redirecting to login...
      </p>
      <Button className="w-full" onClick={() => router.push("/login")}>
        Go to Login
      </Button>
    </>
  );
}

