import { jsonrepair } from "jsonrepair";
import { logger } from "@mocah/shared/logger";

/**
 * Repair malformed JSON output from AI generation
 * Uses the jsonrepair library which handles:
 * - Missing quotes around keys/values
 * - Missing commas
 * - Trailing commas
 * - Comments
 * - Unclosed strings/objects/arrays
 * - Escaped characters in strings
 * - Braces/brackets inside string literals
 */
export async function repairJsonOutput({
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

  try {
    const repaired = jsonrepair(text);

    logger.info("JSON successfully repaired", {
      component: "ai",
      originalLength: text.length,
      repairedLength: repaired.length,
    });

    return repaired;
  } catch (repairError) {
    logger.error("JSON repair failed", {
      component: "ai",
      originalError: error.message,
      repairError:
        repairError instanceof Error ? repairError.message : String(repairError),
    });

    return text;
  }
}
