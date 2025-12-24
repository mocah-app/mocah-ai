"use client";

import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MocahLoadingIcon from "@/components/mocah-brand/MocahLoadingIcon";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

interface CheckoutLoadingModalProps {
  open: boolean;
  plan: string;
  interval: "month" | "year";
}

// ============================================================================
// Component
// ============================================================================

export function CheckoutLoadingModal({
  open,
  plan,
  interval,
}: CheckoutLoadingModalProps) {
  const isCheckoutTriggered = useRef(false);

  // Trigger checkout when modal opens using Better Auth's subscription.upgrade()
  useEffect(() => {
    if (open && plan && interval && !isCheckoutTriggered.current) {
      isCheckoutTriggered.current = true;
      
      authClient.subscription.upgrade({
        plan,
        annual: interval === "year",
        successUrl: `${window.location.origin}/app?checkout=success`,
        cancelUrl: `${window.location.origin}/pricing`,
      }).then((result) => {
        if (result.error) {
          toast.error(`Failed to start checkout: ${result.error.message}`);
          isCheckoutTriggered.current = false;
        }
        // If successful, Better Auth redirects to Stripe Checkout automatically
      }).catch((error) => {
        toast.error(`Failed to start checkout: ${error instanceof Error ? error.message : 'Unknown error'}`);
        isCheckoutTriggered.current = false;
      });
    }
    
    // Reset when modal closes
    if (!open) {
      isCheckoutTriggered.current = false;
    }
  }, [open, plan, interval]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Starting checkout...</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <MocahLoadingIcon isLoading={true} size="md" />
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">Starting your trial...</h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we set up your checkout
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
