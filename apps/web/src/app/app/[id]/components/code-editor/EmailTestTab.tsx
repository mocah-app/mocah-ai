"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Loader2 } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { renderReactEmailClientSide } from "@/lib/react-email/client-renderer";
import type { Template } from "@mocah/db";

interface EmailTestTabProps {
  reactEmailCode: string;
  cachedHtml?: { code: string; html: string } | null;
  template: Template | null;
}

export function EmailTestTab({
  reactEmailCode,
  cachedHtml,
  template,
}: EmailTestTabProps) {
  const [testEmail, setTestEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const sendTestEmailMutation = trpc.emailTest.sendTest.useMutation({
    onSuccess: () => {
      toast.success("Test email sent successfully!");
      setTestEmail("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send test email");
    },
    onSettled: () => {
      setIsSendingEmail(false);
    },
  });

  const handleSendTestEmail = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    const templateId = template?.id;
    if (!templateId) {
      toast.error("Template not found");
      return;
    }

    setIsSendingEmail(true);

    try {
      // Get HTML - use cached HTML if available and matches current code, otherwise render
      let html: string;

      if (cachedHtml && cachedHtml.code === reactEmailCode) {
        html = cachedHtml.html;
      } else {
        // Render HTML client-side
        html = await renderReactEmailClientSide(reactEmailCode);
      }

      // Send test email
      await sendTestEmailMutation.mutateAsync({
        templateId,
        to: testEmail,
        html,
        subject: template?.subject || undefined,
      });
    } catch (error) {
      // Error is handled by mutation onError
      console.error("Failed to send test email:", error);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold tracking-tight">Send Test Email</h3>
          <p className="sr-only">
            Send a test email to verify how your template renders across different email clients.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="test-email" className="text-sm font-medium">
              Recipient Email
            </Label>
            <Input
              id="test-email"
              type="email"
              placeholder="your-email@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              disabled={isSendingEmail || !template?.id}
              className="h-10"
            />
          </div>

          {template?.subject && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Subject</Label>
              <div className="text-sm text-foreground bg-muted/50 px-4 py-2.5 rounded-md border">
                {template.subject}
              </div>
            </div>
          )}

          <Button
            onClick={handleSendTestEmail}
            disabled={
              isSendingEmail ||
              !testEmail ||
              !template?.id ||
              !reactEmailCode
            }
            className="w-full"
          >
            {isSendingEmail ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Email
              </>
            )}
          </Button>

          {!template?.id && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              Template not loaded
            </p>
          )}

          {!reactEmailCode && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              No email code to send
            </p>
          )}
        </div>
      </div>
    </div>
  );
}