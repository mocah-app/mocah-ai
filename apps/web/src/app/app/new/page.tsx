"use client";

import { useImageUpload } from "@/app/app/[id]/components/image-studio/hooks/useImageUpload";
import DashboardHeader from "@/components/dashboardHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useOrganization } from "@/contexts/organization-context";
import { useUpgradeModal } from "@/contexts/upgrade-modal-context";
import { useUsageTracking } from "@/hooks/use-usage-tracking";
import type { Attachment } from "@/types/images";
import { useTemplateCreation } from "@/utils/store-prompt-in-session";
import { trpc } from "@/utils/trpc";
import { CircleChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { UsageWarningBanner, NoSubscriptionBanner } from "@/components/billing/usage-warning-banner";
import React, { useCallback, useRef, useState, useEffect } from "react";
import { PlanSelectionModal } from "@/components/pricing/plan-selection-modal";
import { toast } from "sonner";
import PromptInput from "./components/PromptInput";

export default function NewTemplatePage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { activeOrganization } = useOrganization();
  const { setPrompt: setCreationPrompt } = useTemplateCreation();
  const { triggerUpgrade } = useUpgradeModal();
  const { checkQuota, isNearLimit, getUsagePercentage, plan, usage } = useUsageTracking();
  const [prompt, setPrompt] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [includeBrandGuide, setIncludeBrandGuide] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check subscription status
  const { data: subscriptionData } = trpc.subscription.getCurrent.useQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
    }
  );

  // Determine if user has any active subscription (including trial)
  const hasActiveSubscription = subscriptionData?.subscription && 
    (subscriptionData.subscription.status === "active" || 
     subscriptionData.subscription.status === "trialing");
  const hasNoSubscription = !hasActiveSubscription;

  // Show plan selection modal on mount if no subscription
  const [showPlanModal, setShowPlanModal] = useState(false);
  useEffect(() => {
    if (hasNoSubscription && subscriptionData) {
      setShowPlanModal(true);
    }
  }, [hasNoSubscription, subscriptionData]);
  
  // Check if user is near or at template limit
  const isNearTemplateLimit = isNearLimit("template");
  const templateUsagePercentage = getUsagePercentage("template");
  const canGenerateTemplate = checkQuota("template");

  // Fetch brand guide preference
  const { data: brandGuidePreference } = trpc.brandGuide.getPreference.useQuery(
    undefined,
    {
      enabled: !!activeOrganization?.id,
      refetchOnWindowFocus: false,
    }
  );

  // Update local state when preference is fetched
  useEffect(() => {
    if (brandGuidePreference !== undefined) {
      setIncludeBrandGuide(brandGuidePreference);
    }
  }, [brandGuidePreference]);

  const createSkeletonMutation = trpc.template.core.create.useMutation({
    onSuccess: () => {
      utils.template.core.list.invalidate();
    },
  });

  const [isCreating, setIsCreating] = useState(false);

  // Image upload hook for eager uploads
  const { uploadFile, isUploading } = useImageUpload({
    organizationId: activeOrganization?.id,
    templateId: undefined, // No template yet
    purpose: "template-reference", // Store in template-references folder
    onSuccess: (image) => {
      // Update attachment status to ready
      setAttachments((prev) =>
        prev.map((att) =>
          att.status === "uploading" && att.previewUrl.startsWith("blob:")
            ? { ...att, status: "ready", url: image.url }
            : att
        )
      );
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      // Mark attachment as error
      setAttachments((prev) =>
        prev.map((att) =>
          att.status === "uploading" ? { ...att, status: "error" } : att
        )
      );
    },
  });

  // Handle file upload from device
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Create blob URL for immediate preview
      const blobUrl = URL.createObjectURL(file);
      const attachmentId = crypto.randomUUID();

      // Add attachment in uploading state
      const newAttachment: Attachment = {
        id: attachmentId,
        url: "", // Will be set after upload
        type: "upload",
        status: "uploading",
        previewUrl: blobUrl,
        fileName: file.name,
      };

      setAttachments((prev) => [...prev, newAttachment]);

      // Start eager upload
      await uploadFile(file);

      // Clear input so same file can be selected again
      e.target.value = "";
    },
    [uploadFile]
  );

  // Handle paste URL dialog
  const handlePasteUrlClick = useCallback(() => {
    setIsUrlDialogOpen(true);
  }, []);

  const handleUrlSubmit = useCallback(() => {
    if (!urlInput.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput);
    } catch {
      toast.error("Invalid URL format");
      return;
    }

    const attachmentId = crypto.randomUUID();
    const newAttachment: Attachment = {
      id: attachmentId,
      url: urlInput,
      type: "url",
      status: "ready",
      previewUrl: urlInput,
    };

    setAttachments((prev) => [...prev, newAttachment]);
    setUrlInput("");
    setIsUrlDialogOpen(false);
    toast.success("Image URL added");
  }, [urlInput]);

  // Handle clipboard paste
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      // Check for image in clipboard
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          
          const file = item.getAsFile();
          if (!file) continue;

          // Create blob URL for immediate preview
          const blobUrl = URL.createObjectURL(file);
          const attachmentId = crypto.randomUUID();

          // Add attachment in uploading state
          const newAttachment: Attachment = {
            id: attachmentId,
            url: "", // Will be set after upload
            type: "upload",
            status: "uploading",
            previewUrl: blobUrl,
            fileName: `pasted-${Date.now()}.png`,
          };

          setAttachments((prev) => [...prev, newAttachment]);

          // Start eager upload
          await uploadFile(file);
          return;
        }
      }
    },
    [uploadFile]
  );

  const handleAttachmentRemove = useCallback((id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((att) => att.id === id);
      // Clean up blob URL if it exists
      if (attachment?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
      return prev.filter((att) => att.id !== id);
    });
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (!activeOrganization?.id) {
      toast.error("Please select a workspace first");
      return;
    }

    // Block if no subscription at all
    if (hasNoSubscription) {
      toast.error("Please start a free trial to create templates");
      setShowPlanModal(true);
      return;
    }

    // Check usage quota before generating
    if (!canGenerateTemplate) {
      triggerUpgrade("template", plan?.name);
      return;
    }

    setIsCreating(true);

    // Generate UUID client-side
    const templateId = crypto.randomUUID();

    try {
      // Create skeleton first - ensures template exists before navigation
      // This is fast (~50-100ms) and prevents race conditions
      await createSkeletonMutation.mutateAsync({
        id: templateId,
        name: "New Template",
        description: prompt.trim(),
        subject: prompt.trim().slice(0, 100),
        reactEmailCode: "", // Empty - will be populated by AI generation
        styleType: "STYLE_OBJECTS",
        isPublic: false,
      });

      // Store prompt and image URLs for the streaming process
      const imageUrls = attachments
        .filter((att) => att.status === "ready")
        .map((att) => att.url);
      
      setCreationPrompt(prompt.trim(), imageUrls);

      // Navigate after skeleton exists
      router.push(`/app/${templateId}`);
    } catch (error) {
      console.error("Failed to create template:", error);
      toast.error("Failed to create template. Please try again.");
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !isCreating) {
      e.preventDefault();
      handleGenerate();
    }
  };

  // Suggested prompts
  const suggestedPrompts = [
    {
      label: "Welcome Email",
      prompt:
        "Create a warm welcome email for new subscribers that introduces our brand story, includes a personalized greeting, highlights our key products or services, and offers an exclusive 15% discount coupon code for their first purchase. Include a clear call-to-action button and social media links.",
    },
    {
      label: "Black Friday Sales",
      prompt:
        "Design a high-energy Black Friday sales announcement email with eye-catching headlines, showcase our top 5 trending products with discount percentages, include countdown timer graphics, add urgency messaging about limited stock, and feature multiple call-to-action buttons for different product categories.",
    },
    {
      label: "Monthly Newsletter",
      prompt:
        "Generate a professional monthly newsletter that includes a friendly introduction from the CEO, highlights of 3 major feature updates with screenshots, customer success story spotlight, upcoming webinar announcement, relevant blog article links",
    },
    {
      label: "Abandoned Cart Reminder",
      prompt:
        "Draft a persuasive abandoned cart recovery email for an online store that shows product images of items left behind, displays the total cart value, addresses common purchase concerns, offers a time-sensitive 10% discount incentive, includes customer testimonials, and provides easy one-click checkout link.",
    },
    {
      label: "Feedback Request",
      prompt:
        "Design a thoughtful post-purchase feedback request email that thanks the customer for their recent order, asks for honest product review with star rating, includes direct review platform links, offers a 10% discount coupon for their next purchase as appreciation, and shows how customer feedback helps improve our service.",
    },
    {
      label: "Product Launch",
      prompt:
        "Create an exciting product launch announcement email featuring: compelling hero image of the new product, detailed description of key features and benefits, early-bird exclusive 20% discount for first 100 customers, product demonstration video embed, pre-order button, expected shipping timeline, and FAQ section.",
    },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center relative">
      <div className="w-full">
        <DashboardHeader />
      </div>
      {/* gradient shape background */}
      <div className="absolute w-2xl h-1/2 bg-linear-to-b z-0 from-primary-transparent dark:from-primary-foreground/40 to-blue-500/30 dark:to-blue-950 rounded-full blur-3xl left-1/2 -translate-x-1/2 top-0"></div>
      <div className="w-full max-w-4xl space-y-8 z-10 flex flex-col items-center justify-center px-4">
        {/* No Subscription Banner - blocks user from generating */}
        {hasNoSubscription && (
          <NoSubscriptionBanner
            type="template"
            variant="alert"
            className="max-w-2xl"
          />
        )}

        {/* Usage Warning Banner - shows when user has subscription but is near limit */}
        {hasActiveSubscription && !hasNoSubscription && (
          <UsageWarningBanner
            type="template"
            percentage={templateUsagePercentage}
            remaining={usage?.templatesRemaining}
            variant="alert"
            className="max-w-2xl"
          />
        )}

        {/* Header */}
        <div className="text-center space-y-4 pt-8">
          <h1 className="text-2xl md:text-4xl text-balance font-bold text-foreground tracking-tight">
            What template will you create?
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Generate fully responsive, high-impact email templates in seconds.
          </p>
        </div>

        {/* Main Input Area */}
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onSubmit={handleGenerate}
          onKeyDown={handleKeyDown}
          isLoading={isCreating}
          attachments={attachments}
          onAttachmentRemove={handleAttachmentRemove}
          onUploadClick={handleUploadClick}
          onPasteUrlClick={handlePasteUrlClick}
          onPaste={handlePaste}
          includeBrandGuide={includeBrandGuide}
          onBrandGuideChange={setIncludeBrandGuide}
          disabled={hasNoSubscription}
        />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* URL paste dialog */}
        <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Paste Image URL</DialogTitle>
              <DialogDescription className="sr-only">
                Enter the URL of an image you want to use as reference
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUrlSubmit();
                }
              }}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUrlDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUrlSubmit}>Add Image</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suggested Prompts */}
        <div className="space-y-3 mx-auto max-w-2xl w-full">
          <h3 className="text-sm font-medium text-muted-foreground">
            Suggested prompts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
            {suggestedPrompts.map((suggestion, index) => (
              <Button
                variant="outline"
                key={index}
                onClick={() => setPrompt(suggestion.prompt)}
                disabled={isCreating || hasNoSubscription}
                className="w-full justify-between h-auto group/item overflow-clip hover:border-primary/50"
              >
                <span className="text-wrap text-left">{suggestion.label}</span>
                <CircleChevronUp className="size-4 text-muted-foreground invisible group-hover/item:visible transition-all duration-200 translate-y-8 group-hover/item:translate-y-0" />
              </Button>
            )            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Press{" "}
            <kbd className="px-2 py-1 bg-muted rounded text-muted-foreground">
              ⌘
            </kbd>{" "}
            +{" "}
            <kbd className="px-2 py-1 bg-muted rounded text-muted-foreground">
              Enter
            </kbd>{" "}
            to generate
          </p>
        </div>
      </div>

      {/* Plan Selection Modal - shown on mount if no subscription */}
      <PlanSelectionModal
        open={showPlanModal}
        onOpenChange={setShowPlanModal}
      />
    </div>
  );
}
