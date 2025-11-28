import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject, generateText, streamObject, streamText } from "ai";
import { z } from "zod";
import { logger } from "@mocah/shared/logger";

// Initialize OpenRouter provider
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Default model from environment or fallback
export const DEFAULT_MODEL =
  process.env.OPENROUTER_DEFAULT_MODEL || "anthropic/claude-3.5-sonnet";

// Template generation model (optional, falls back to DEFAULT_MODEL)
export const TEMPLATE_GENERATION_MODEL =
  process.env.OPENROUTER_TEMPLATE_MODEL || DEFAULT_MODEL;

/**
 * Options for structured generation with enhanced reliability
 */
export interface StructuredGenerationOptions {
  /** Name for the schema (helps model understand context) */
  schemaName?: string;
  /** Description of what the schema represents */
  schemaDescription?: string;
  /** Temperature for generation (0-1, lower = more consistent) */
  temperature?: number;
  /** Maximum retries on failure */
  maxRetries?: number;
  /** Callback for stream errors */
  onError?: (error: unknown) => void;
}

/**
 * Repair function for malformed JSON output
 * Called automatically when JSON parsing fails
 */
async function repairJsonOutput({
  text,
  error,
}: {
  text: string;
  error: Error;
}): Promise<string> {
  logger.warn("Attempting to repair malformed JSON", {
    component: "ai",
    error: error.message,
    textLength: text.length,
  });

  let repaired = text;

  // Fix trailing commas before } or ]
  repaired = repaired.replace(/,(\s*[}\]])/g, "$1");

  // Fix unescaped newlines in strings
  repaired = repaired.replace(/(?<!\\)\n(?=[^"]*"[^"]*$)/gm, "\\n");

  // Try to close unclosed strings
  const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    repaired += '"';
  }

  // Try to close unclosed objects/arrays
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  for (let i = 0; i < openBraces - closeBraces; i++) {
    repaired += "}";
  }

  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/]/g) || []).length;
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    repaired += "]";
  }

  return repaired;
}

/**
 * AI Client wrapper for OpenRouter integration
 * Provides structured output generation and error handling
 */
export const aiClient = {
  /**
   * Generate structured JSON output using Zod schema
   * @param schema - Zod schema for validation
   * @param prompt - Generation prompt
   * @param model - Optional model override
   * @param options - Reliability options
   */
  async generateStructured<T extends z.ZodType>(
    schema: T,
    prompt: string,
    model?: string,
    options?: StructuredGenerationOptions
  ): Promise<z.infer<T>> {
    const modelName = model || DEFAULT_MODEL;
    try {
      const { object } = await generateObject({
        model: openrouter(modelName),
        schema,
        prompt,
        // Reliability options
        schemaName: options?.schemaName,
        schemaDescription: options?.schemaDescription,
        temperature: options?.temperature ?? 0.7,
        maxRetries: options?.maxRetries ?? 3,
        experimental_repairText: repairJsonOutput,
      });

      logger.info("AI structured response generated", {
        component: "ai",
        action: "generateStructured",
        model: modelName,
      });

      return object as z.infer<T>;
    } catch (error) {
      logger.error("AI generation error", {
        component: "ai",
        action: "generateStructured",
        model: modelName,
      }, error as Error);
      throw new Error("Failed to generate structured output");
    }
  },

  /**
   * Generate text output
   * @param prompt - Generation prompt
   * @param model - Optional model override
   */
  async generateText(prompt: string, model?: string): Promise<string> {
    const modelName = model || DEFAULT_MODEL;
    try {
      const { text } = await generateText({
        model: openrouter(modelName),
        prompt,
      });

      logger.info("AI text response generated", {
        component: "ai",
        action: "generateText",
        model: modelName,
        response: text,
      });

      return text;
    } catch (error) {
      logger.error("AI generation error", {
        component: "ai",
        action: "generateText",
        model: modelName,
      }, error as Error);
      throw new Error("Failed to generate text");
    }
  },

  /**
   * Stream structured JSON output using Zod schema
   * Returns streams for progressive rendering with enhanced reliability
   * @param schema - Zod schema for validation
   * @param prompt - Generation prompt
   * @param model - Optional model override
   * @param options - Reliability options
   */
  streamStructured<T extends z.ZodType>(
    schema: T,
    prompt: string,
    model?: string,
    options?: StructuredGenerationOptions
  ): ReturnType<typeof streamObject<T>> {
    const modelName = model || DEFAULT_MODEL;

    logger.info("AI streaming started", {
      component: "ai",
      action: "streamStructured",
      model: modelName,
    });

    return streamObject({
      model: openrouter(modelName),
      schema,
      prompt,
      // Reliability options
      schemaName: options?.schemaName,
      schemaDescription: options?.schemaDescription,
      temperature: options?.temperature ?? 0.7,
      maxRetries: options?.maxRetries ?? 3,
      experimental_repairText: repairJsonOutput,
      // Error handling
      onError: (event) => {
        logger.error("AI stream error", {
          component: "ai",
          action: "streamStructured",
          model: modelName,
          error: event.error,
        });
        options?.onError?.(event.error);
      },
      onFinish: ({ usage, object, error }) => {
        if (error) {
          logger.error("AI stream finished with error", {
            component: "ai",
            action: "streamStructured",
            model: modelName,
            error: String(error),
          });
        } else {
          logger.info("AI stream completed", {
            component: "ai",
            action: "streamStructured",
            model: modelName,
            tokensUsed: usage.totalTokens,
            hasValidObject: !!object,
          });
        }
      },
    });
  },

  /**
   * Stream text output
   * @param prompt - Generation prompt
   * @param model - Optional model override
   */
  streamText(prompt: string, model?: string): ReturnType<typeof streamText> {
    const modelName = model || DEFAULT_MODEL;
    try {
      logger.info("AI text streaming started", {
        component: "ai",
        action: "streamText",
        model: modelName,
      });

      return streamText({
        model: openrouter(modelName),
        prompt,
        onFinish: ({ usage }) => {
          logger.info("AI text stream completed", {
            component: "ai",
            action: "streamText",
            model: modelName,
            tokensUsed: usage.totalTokens,
          });
        },
      });
    } catch (error) {
      logger.error("AI text streaming error", {
        component: "ai",
        action: "streamText",
        model: modelName,
      }, error as Error);
      throw new Error("Failed to stream text");
    }
  },
};

/**
 * Retry wrapper for AI operations
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param delay - Delay between retries in ms
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}
