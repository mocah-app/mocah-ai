"use client";
import EdgeRayLoader from "@/components/EdgeLoader";
import Loader from "@/components/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PrivacyPage() {

  const router = useRouter();
  useEffect(() => {
    router.push("/dashboard");
  }, []);
  return (
    <div className="flex w-full min-h-full items-center justify-center relative">
      <EdgeRayLoader />
      <Loader />
    </div>
  );
}
