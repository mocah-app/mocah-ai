"use client";

import { useState, useCallback, useRef } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { reactEmailGenerationSchema } from "@mocah/api/lib/prompts";
import type { z } from "zod";

type TemplateGenerationOutput = z.infer<typeof reactEmailGenerationSchema>;

interface UseStreamTemplateOptions {
  organizationId: string;
  onComplete?: (template: TemplateGenerationOutput) => void;
  onError?: (error: Error) => void;
  /** Maximum client-side retries (default: 2) */
  maxRetries?: number;
}

/**
 * Hook for streaming template generation from AI
 * Uses AI SDK's useObject hook with enhanced reliability
 */
export function useStreamTemplate({
  organizationId,
  onComplete,
  onError,
  maxRetries = 2,
}: UseStreamTemplateOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const lastPromptRef = useRef<string>("");

  const { object, submit, error, isLoading, stop } = useObject({
    api: "/api/template/generate",
    schema: reactEmailGenerationSchema,
    onFinish: ({ object: finalObject, error: finishError }) => {
      // Handle generation errors with retry logic
      if (finishError) {
        console.error("[useStreamTemplate] Generation error:", finishError);

        // Retry if under limit
        if (retryCount < maxRetries && lastPromptRef.current) {
          console.warn(`[useStreamTemplate] Retrying (${retryCount + 1}/${maxRetries})...`);
          setRetryCount((prev) => prev + 1);

          // Retry after delay (exponential backoff)
          setTimeout(() => {
            submit({
              prompt: lastPromptRef.current,
              organizationId,
            });
          }, 1000 * (retryCount + 1));
          return;
        }

        // Max retries exceeded
        setIsGenerating(false);
        setRetryCount(0);
        onError?.(finishError as Error);
        return;
      }

      // Success - validate the result
      setIsGenerating(false);
      setRetryCount(0);

      if (finalObject) {
        // Validate required fields exist
        if (!finalObject.reactEmailCode || !finalObject.subject) {
          console.error("[useStreamTemplate] Incomplete result:", {
            hasCode: !!finalObject.reactEmailCode,
            hasSubject: !!finalObject.subject,
          });
          onError?.(new Error("Generated template is incomplete. Please try again."));
          return;
        }

        onComplete?.(finalObject);
      }
    },
    onError: (err) => {
      // Let onFinish handle retries - just log here
      console.error("[useStreamTemplate] Stream error:", err);
    },
  });

  const generate = useCallback(
    async (prompt: string) => {
      setIsGenerating(true);
      setRetryCount(0);
      lastPromptRef.current = prompt;

      await submit({
        prompt,
        organizationId,
      });
    },
    [submit, organizationId]
  );

  const cancel = useCallback(() => {
    stop();
    setIsGenerating(false);
    setRetryCount(0);
    lastPromptRef.current = "";
  }, [stop]);

  return {
    /** Partial template object as it's being generated */
    partialTemplate: object,
    /** Function to start generation */
    generate,
    /** Cancel ongoing generation */
    cancel,
    /** Whether generation is in progress */
    isGenerating: isGenerating || isLoading,
    /** Error if one occurred */
    error,
    /** Current retry attempt (0 = first try) */
    retryCount,
  };
}
