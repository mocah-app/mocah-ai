"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useOrganization } from "@/contexts/organization-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Zap, Rocket, Loader2 } from "lucide-react";

export default function WelcomePage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const { organizations, isLoading: orgsLoading } = useOrganization();

  // Check if user already has workspaces
  useEffect(() => {
    if (!sessionLoading && !orgsLoading) {
      if (!session?.user) {
        // Not logged in, redirect to login
        router.push("/login");
      } else if (organizations && organizations.length > 0) {
        // User already has workspaces, go to dashboard
        router.push("/dashboard");
      }
    }
  }, [session, organizations, sessionLoading, orgsLoading, router]);

  if (sessionLoading || orgsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="max-w-2xl w-full border-2">
        <CardContent className="pt-10 pb-10 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Welcome to Your AI Email Studio! 🎨
            </h1>
            <p className="text-xl text-muted-foreground">
              Create beautiful, on-brand email templates in seconds
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 py-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">AI-Powered</h3>
              <p className="text-sm text-muted-foreground">
                Generate complete templates from simple prompts
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">On-Brand</h3>
              <p className="text-sm text-muted-foreground">
                Every template matches your brand perfectly
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Export Anywhere</h3>
              <p className="text-sm text-muted-foreground">
                Use with Mailchimp, Klaviyo, or download HTML
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center space-y-4">
            <Button
              size="lg"
              onClick={() => router.push("/brand-setup")}
              className="w-full max-w-sm"
            >
              Create Your First Brand
            </Button>
            <p className="text-sm text-muted-foreground">
              Takes less than 2 minutes to set up
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
