import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject, generateText } from "ai";
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
 * AI Client wrapper for OpenRouter integration
 * Provides structured output generation and error handling
 */
export const aiClient = {
  /**
   * Generate structured JSON output using Zod schema
   * @param schema - Zod schema for validation
   * @param prompt - Generation prompt
   * @param model - Optional model override
   */
  async generateStructured<T extends z.ZodType>(
    schema: T,
    prompt: string,
    model?: string
  ): Promise<z.infer<T>> {
    const modelName = model || DEFAULT_MODEL;
    try {
      const { object } = await generateObject({
        model: openrouter(modelName),
        schema,
        prompt,
      });

      logger.info("AI structured response generated", {
        component: "ai",
        action: "generateStructured",
        model: modelName,
        response: JSON.stringify(object, null, 2),
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
