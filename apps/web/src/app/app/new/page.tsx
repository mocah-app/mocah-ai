"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useOrganization } from "@/contexts/organization-context";
import { useTemplateCreation } from "@/utils/store-prompt-in-session";
import { trpc } from "@/utils/trpc";
import { CircleChevronUp, Loader, Plus, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

export default function NewTemplatePage() {
  const router = useRouter();
  const { activeOrganization } = useOrganization();
  const { setPrompt: setCreationPrompt } = useTemplateCreation();
  const [prompt, setPrompt] = useState("");

  const createSkeletonMutation = trpc.template.create.useMutation();

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (!activeOrganization?.id) {
      toast.error("Please select a workspace first");
      return;
    }

    // Generate UUID client-side for instant navigation
    const templateId = crypto.randomUUID();

    // Store prompt for the streaming process
    setCreationPrompt(prompt.trim());

    // Navigate immediately (optimistic UI)
    router.push(`/app/${templateId}`);

    // Create skeleton in background (fire-and-forget)
    createSkeletonMutation.mutate(
      {
        id: templateId, // Use pre-generated ID
        name: "Empty Template",
        description: "This is an empty template",
        subject: prompt.trim().slice(0, 100),
        content: JSON.stringify({ sections: [] }),
        isPublic: false,
      },
      {
        onError: (error) => {
          console.error("Failed to create skeleton template:", error);
          // User already navigated, show toast but don't block
          toast.error("Failed to initialize template");
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  // Suggested prompts
  const suggestedPrompts = [
    {
      label: "Welcome Email",
      prompt: "Create a welcome email for new subscribers with a coupon code",
    },
    {
      label: "Black Friday Sales",
      prompt:
        "Write a Black Friday sales announcement with bold product highlights",
    },
    {
      label: "Monthly Newsletter",
      prompt:
        "Generate a monthly newsletter for a SaaS business with feature updates",
    },
    {
      label: "Abandoned Cart Reminder",
      prompt: "Draft an abandoned cart reminder email for an online store",
    },
    {
      label: "Feedback Request",
      prompt:
        "Design a feedback request email post-purchase with a discount for reviews",
    },
    {
      label: "Product Launch",
      prompt: "Create a product launch email for a new product with a discount",
    },
  ];

  return (
    <div className="min-h-screen w-full flex items-center relative justify-center p-4">
      {/* gradient shape background */}
      <div className="absolute w-2xl h-1/2 bg-linear-to-b z-0 from-primary-transparent dark:from-primary-foreground/40 to-blue-500/30 dark:to-blue-950 rounded-full blur-3xl left-1/2 -translate-x-1/2 top-0"></div>
      <div className="w-full max-w-4xl space-y-8 z-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">
            What template will you create?
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Generate fully responsive, high-impact email templates in seconds.
          </p>
        </div>

        {/* Main Input Area */}
        <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-3xl mx-auto has-focus-visible:border-blue-500/30 transition-colors">
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
                disabled={!prompt.trim()}
                size="icon"
                aria-label="generate template"
                className="h-10 w-10"
              >
                <Send className="size-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Suggested Prompts */}
        <div className="space-y-3 mx-auto max-w-2xl">
          <h3 className="text-sm font-medium text-muted-foreground">
            Suggested prompts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestedPrompts.map((suggestion, index) => (
              <Button
                variant="outline"
                key={index}
                onClick={() => setPrompt(suggestion.prompt)}
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
