import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject, generateText } from "ai";
import { z } from "zod";

// Initialize OpenRouter provider
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Default model from environment or fallback
const DEFAULT_MODEL =
  process.env.OPENROUTER_DEFAULT_MODEL || "anthropic/claude-3.5-sonnet";

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
    try {
      const { object } = await generateObject({
        model: openrouter(model || DEFAULT_MODEL),
        schema,
        prompt,
      });

      return object;
    } catch (error) {
      console.error("AI generation error:", error);
      throw new Error("Failed to generate structured output");
    }
  },

  /**
   * Generate text output
   * @param prompt - Generation prompt
   * @param model - Optional model override
   */
  async generateText(prompt: string, model?: string): Promise<string> {
    try {
      const { text } = await generateText({
        model: openrouter(model || DEFAULT_MODEL),
        prompt,
      });

      return text;
    } catch (error) {
      console.error("AI generation error:", error);
      throw new Error("Failed to generate text");
    }
  },

  /**
   * Test connection to OpenRouter
   */
  async testConnection(): Promise<boolean> {
    try {
      await generateText({
        model: openrouter(DEFAULT_MODEL),
        prompt: "Say 'OK' if you can read this.",
        maxTokens: 10,
      });
      return true;
    } catch (error) {
      console.error("OpenRouter connection test failed:", error);
      return false;
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
