"use client";

import DashboardHeader from "@/components/dashboardHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useOrganization } from "@/contexts/organization-context";
import { useTemplateCreation } from "@/utils/store-prompt-in-session";
import { trpc } from "@/utils/trpc";
import { CircleChevronUp, Plus, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import Loader from "@/components/loader";

export default function NewTemplatePage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { activeOrganization } = useOrganization();
  const { setPrompt: setCreationPrompt } = useTemplateCreation();
  const [prompt, setPrompt] = useState("");

  const createSkeletonMutation = trpc.template.create.useMutation({
    onSuccess: () => {
      utils.template.list.invalidate();
    },
  });

  const [isCreating, setIsCreating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (!activeOrganization?.id) {
      toast.error("Please select a workspace first");
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

      // Store prompt for the streaming process
      setCreationPrompt(prompt.trim());

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
        <div className="bg-card border border-border rounded-2xl shadow-2xl md:max-w-2xl lg:max-w-3xl w-full mx-auto has-focus-visible:border-blue-500/30 transition-colors">
          <div className="relative">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              placeholder="Please create black friday email showing our trending products"
              className="w-full border-0 dark:bg-transparent text-foreground placeholder:text-muted-foreground px-6 py-7 h-auto pr-16 min-h-[120px] max-h-[250px] resize-none scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 leading-relaxed"
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" aria-label="attachment">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isCreating}
                size="icon"
                aria-label="generate template"
                className="h-10 w-10"
              >
                {isCreating ? (
                  <Loader />
                ) : (
                  <Send className="size-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

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
                disabled={isCreating}
                className="w-full justify-between h-auto group/item overflow-clip hover:border-primary/50"
              >
                <span className="text-wrap text-left">{suggestion.label}</span>
                <CircleChevronUp className="size-4 text-muted-foreground invisible group-hover/item:visible transition-all duration-200 translate-y-8 group-hover/item:translate-y-0" />
              </Button>
            ))}
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
    </div>
  );
}
