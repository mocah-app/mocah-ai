"use client";

import { useState, useCallback } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { reactEmailGenerationSchema } from "@mocah/api/lib/prompts";
import type { z } from "zod";

type TemplateGenerationOutput = z.infer<typeof reactEmailGenerationSchema>;

interface UseStreamTemplateOptions {
  organizationId: string;
  onComplete?: (template: TemplateGenerationOutput) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for streaming template generation from AI
 * Uses AI SDK's useObject hook for seamless streaming
 */
export function useStreamTemplate({
  organizationId,
  onComplete,
  onError,
}: UseStreamTemplateOptions) {
  const [isGenerating, setIsGenerating] = useState(false);

  const { object, submit, error, isLoading } = useObject({
    api: "/api/template/generate",
    schema: reactEmailGenerationSchema,
    onFinish: ({ object: finalObject }) => {
      setIsGenerating(false);
      if (finalObject && onComplete) {
        onComplete(finalObject);
      }
    },
    onError: (err) => {
      setIsGenerating(false);
      if (onError) {
        onError(err as Error);
      }
    },
  });

  const generate = useCallback(
    async (prompt: string) => {
      setIsGenerating(true);
      await submit({
        prompt,
        organizationId,
      });
    },
    [submit, organizationId]
  );

  return {
    /** Partial template object as it's being generated */
    partialTemplate: object,
    /** Function to start generation */
    generate,
    /** Whether generation is in progress */
    isGenerating: isGenerating || isLoading,
    /** Error if one occurred */
    error,
  };
}
