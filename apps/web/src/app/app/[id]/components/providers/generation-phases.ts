/**
 * Generation phase tracking for template AI streaming
 * Provides engaging status messages during template generation
 */

// Partial template shape during streaming
export interface StreamingProgress {
  subject?: string;
  previewText?: string;
  reactEmailCode?: string;
  styleType?: "inline" | "predefined-classes" | "style-objects";
  styleDefinitionsJson?: string;
  metadata?: {
    emailType?: string;
    generatedAt?: string;
    model?: string;
    tokensUsed?: number;
  };
}

// Generation phases for engaging UX
export type GenerationPhase =
  | "idle"
  | "starting"
  | "analyzing"
  | "generating-subject"
  | "generating-preview"
  | "generating-code"
  | "finalizing"
  | "complete";

// Phase messages for dynamic UI - fun and engaging
export const GENERATION_PHASE_MESSAGES: Record<GenerationPhase, string> = {
  idle: "",
  starting: "Brewing...",
  analyzing: "Analyzing...",
  "generating-subject": "Crafting subject line...",
  "generating-preview": "Writing preview text...",
  "generating-code": "Building template...",
  finalizing: "Adding finishing touches...",
  complete: "Template ready!",
};

/**
 * Determine the current generation phase based on streaming progress
 */
export function getNextPhase(
  currentPhase: GenerationPhase,
  isGenerating: boolean,
  progress: StreamingProgress | null
): GenerationPhase {
  // Not generating = keep current or idle
  if (!isGenerating) {
    return currentPhase;
  }

  // isGenerating is true from here on

  // Check progress content to determine specific phase
  if (progress) {
    if (progress.reactEmailCode && progress.reactEmailCode.length > 100) {
      return "generating-code";
    }
    if (progress.previewText) {
      return "generating-preview";
    }
    if (progress.subject) {
      return "generating-subject";
    }
    // Progress object exists but empty/partial = analyzing
    return "analyzing";
  }

  // isGenerating=true but no progress yet
  // Quickly transition from starting -> analyzing after a tick
  // If already past starting, keep current phase
  if (currentPhase === "idle" || currentPhase === "starting") {
    return "starting";
  }

  return currentPhase;
}
