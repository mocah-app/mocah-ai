// "use client";

// import { useEffect, useRef } from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import MocahLoadingIcon from "@/components/mocah-brand/MocahLoadingIcon";
// import { authClient } from "@/lib/auth-client";
// import { useOptionalAuth } from "@/lib/use-auth";
// import { toast } from "sonner";
// import { trpc } from "@/utils/trpc";

// // ============================================================================
// // Types
// // ============================================================================

// interface CheckoutLoadingModalProps {
//   open: boolean;
//   plan: string;
//   interval: "month" | "year";
// }

// // ============================================================================
// // Component
// // ============================================================================

// export function CheckoutLoadingModal({
//   open,
//   plan,
//   interval,
// }: CheckoutLoadingModalProps) {
//   const { session } = useOptionalAuth();
//   const isCheckoutTriggered = useRef(false);

//   // Get current subscription to check for existing subscriptionId
//   const { data: subscriptionData } = trpc.subscription.getCurrent.useQuery(
//     undefined,
//     {
//       enabled: !!session?.user, // Only fetch when authenticated
//       refetchOnWindowFocus: false,
//     }
//   );

//   // Mutation to store checkout preference before Better Auth checkout
//   const setCheckoutPref = trpc.subscription.setCheckoutPreference.useMutation();

//   // Trigger checkout when modal opens using Better Auth's subscription.upgrade()
//   useEffect(() => {
//     if (open && plan && interval && !isCheckoutTriggered.current) {
//       isCheckoutTriggered.current = true;
      
//       const isAnnual = interval === "year";
      
//       // Store checkout preference first, then proceed with Better Auth checkout
//       setCheckoutPref.mutateAsync({ annual: isAnnual }).then(() => {
//         // If user has an existing subscription, pass subscriptionId to upgrade instead of creating new one
//         const existingSubscription = subscriptionData?.subscription;
//         const upgradeParams: Parameters<typeof authClient.subscription.upgrade>[0] = {
//           plan,
//           annual: isAnnual,
//           successUrl: `${window.location.origin}/app?checkout=success`,
//           cancelUrl: `${window.location.origin}/pricing`,
//         };

//         // Include subscriptionId if user has an active/trialing subscription to avoid duplicate creation
//         if (existingSubscription?.stripeSubscriptionId && 
//             (existingSubscription.status === "active" || existingSubscription.status === "trialing")) {
//           upgradeParams.subscriptionId = existingSubscription.stripeSubscriptionId;
//         }
        
//         return authClient.subscription.upgrade(upgradeParams);
//       }).then((result) => {
//         if (result.error) {
//           toast.error(`Failed to start checkout: ${result.error.message}`);
//           isCheckoutTriggered.current = false;
//         }
//         // If successful, Better Auth redirects to Stripe Checkout automatically
//       }).catch((error) => {
//         toast.error(`Failed to start checkout: ${error instanceof Error ? error.message : 'Unknown error'}`);
//         isCheckoutTriggered.current = false;
//       });
//     }
    
//     // Reset when modal closes
//     if (!open) {
//       isCheckoutTriggered.current = false;
//     }
//   }, [open, plan, interval, subscriptionData, setCheckoutPref]);

//   return (
//     <Dialog open={open} onOpenChange={() => {}}>
//       <DialogContent className="sm:max-w-md" showCloseButton={false}>
//         <DialogHeader className="sr-only">
//           <DialogTitle>Starting checkout...</DialogTitle>
//         </DialogHeader>
//         <div className="flex flex-col items-center justify-center py-8 gap-4">
//           <MocahLoadingIcon isLoading={true} size="md" />
//           <div className="text-center space-y-2">
//             <h3 className="font-semibold text-lg">Starting your trial...</h3>
//             <p className="text-sm text-muted-foreground">
//               Please wait while we set up your checkout
//             </p>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }
