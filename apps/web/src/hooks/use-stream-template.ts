"use client";

import { useState, useCallback, useRef } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { reactEmailGenerationSchema } from "@mocah/api/lib/prompts";
import type { z } from "zod";

type TemplateGenerationOutput = z.infer<typeof reactEmailGenerationSchema>;

interface UseStreamTemplateOptions {
  organizationId?: string;
  templateId?: string;
  onComplete?: (template: TemplateGenerationOutput) => void;
  onError?: (error: Error) => void;
  /** Maximum client-side retries (default: 2) */
  maxRetries?: number;
  /** API endpoint (default: /api/template/generate) */
  apiEndpoint?: string;
  
  // V2 AI Enhancement Options
  /** Generation mode: v1 (streamObject) or v2 (streamText + tools) - default: v1 */
  mode?: 'v1' | 'v2';
  /** Enable AI reasoning (v2 only) - default: true */
  enableReasoning?: boolean;
  /** Enable tool calling for brand context, validation (v2 only) - default: true */
  enableTools?: boolean;
}

/**
 * Hook for streaming template generation from AI
 * Uses AI SDK's useObject hook with enhanced reliability
 * 
 * @param mode - 'v1' for streamObject (default), 'v2' for streamText + tools
 * @param enableReasoning - Enable AI reasoning in v2 mode (default: true)
 * @param enableTools - Enable tool calling in v2 mode (default: true)
 */
export function useStreamTemplate({
  organizationId,
  templateId,
  onComplete,
  onError,
  maxRetries = 2,
  apiEndpoint = "/api/template/generate",
  mode = 'v1',
  enableReasoning = true,
  enableTools = true,
}: UseStreamTemplateOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const lastPromptRef = useRef<string>("");
  const lastBodyRef = useRef<Record<string, string>>({});

  const { object, submit, error, isLoading, stop } = useObject({
    api: apiEndpoint,
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
            submit(lastBodyRef.current);
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
    async (prompt: string, imageUrls?: string[]) => {
      setIsGenerating(true);
      setRetryCount(0);
      lastPromptRef.current = prompt;

      // Build request body based on whether it's generation or regeneration
      const body: Record<string, any> = { 
        prompt,
        mode, // v1 or v2
      };
      
      if (templateId) {
        // Regeneration: needs templateId
        body.templateId = templateId;
      } else if (organizationId) {
        // Generation: needs organizationId
        body.organizationId = organizationId;
      }

      // Add imageUrls if provided
      if (imageUrls && imageUrls.length > 0) {
        body.imageUrls = imageUrls;
      }

      // V2 enhancement options (only honored in v2 mode)
      if (mode === 'v2') {
        body.enableReasoning = enableReasoning;
        body.enableTools = enableTools;
      }
      
      lastBodyRef.current = body;

      await submit(body);
    },
    [submit, organizationId, templateId, mode, enableReasoning, enableTools]
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
