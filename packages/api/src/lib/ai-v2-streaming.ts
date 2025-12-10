/**
 * AI V2 Streaming Implementation - UI Message Stream
 *
 * This module exposes the backend implementation for template generation V2
 * using the AI SDK **UI message stream** protocol.
 *
 * High-level responsibilities:
 * - Use `streamText` with tools (brand settings, template context, validation, submitTemplate)
 * - Wrap the result in `createUIMessageStream` so we can emit custom `data-submitTemplate`
 *   parts for the frontend to consume via `useChat`.
 * - Keep all business logic (brand kit fetch, system prompt, tool registry) in the API layer.
 */

import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  stepCountIs,
  tool,
  type UIMessage,
  type UIMessageStreamWriter,
} from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { logger } from "@mocah/shared/logger";
import { serverEnv } from "@mocah/config/env";
import { buildReactEmailPrompt } from "./prompts";
import { getToolsForContext } from "./tools";
import {
  submitTemplateSchema,
  submitTemplateTool,
} from "./tools/submit-template";

const openrouter = createOpenRouter({
  apiKey: serverEnv.OPENROUTER_API_KEY,
});

/**
 * Data type for the submitTemplate tool output that we want to expose to the UI.
 * This mirrors the Zod schema in `submitTemplateSchema` but keeps this file
 * independent of Zod at runtime.
 */
export type TemplateSubmitPart = {
  subject: string;
  previewText: string;
  reactEmailCode: string;
  tone?: string;
  keyPoints?: string[];
};

export type TemplateDataTypes = {
  submitTemplate: TemplateSubmitPart;
};

/**
 * UI message type for template generation chat.
 *
 * - `metadata` can carry extra information like organizationId/templateId if we
 *   ever want to send it from the client.
 * - `TemplateDataTypes` defines the custom `data-*` parts we can emit.
 */
export type TemplateUiMessage = UIMessage<
  { organizationId?: string; templateId?: string },
  TemplateDataTypes,
  any
>;

export interface StreamTemplateV2Options {
  messages: TemplateUiMessage[];
  organizationId: string;
  templateId?: string;
  enableReasoning?: boolean;
  enableTools?: boolean;
  metadata?: {
    userId?: string;
    mode?: string;
  };
}

/**
 * UI-aware submitTemplate tool.
 *
 * Wraps the existing `submitTemplateTool` so we can:
 * - Emit a `data-submitTemplate` part into the UI message stream.
 * - Keep logging behavior from the original tool.
 */
function createSubmitTemplateUiTool(
  writer: UIMessageStreamWriter<TemplateUiMessage>
) {
  return tool({
    name: "submitTemplate",
    description: submitTemplateTool.description,
    inputSchema: submitTemplateSchema,
    async execute(input) {
      // Stream template data into the UI as a custom data part
      writer.write({
        type: "data-submitTemplate",
        id: "template",
        data: {
          subject: input.subject,
          previewText: input.previewText,
          reactEmailCode: input.reactEmailCode,
          tone: input.tone,
          keyPoints: input.keyPoints,
        },
      });

      // Preserve existing logging/behavior from the core tool
      await submitTemplateTool.execute(input);

      return {
        success: true,
        message:
          "Template received successfully. The user will now see your generated template.",
      };
    },
  });
}

export async function streamTemplateV2(
  options: StreamTemplateV2Options,
  model?: string
) {
  const {
    messages,
    organizationId,
    templateId,
    enableReasoning = true,
    enableTools = true,
    metadata,
  } = options;

  const modelName = model || "anthropic/claude-3.5-sonnet";
  const startTime = Date.now();

  logger.info("[AI V2] Starting generation with streamText", {
    organizationId,
    templateId,
    enableReasoning,
    enableTools,
    model: modelName,
  });

  // Load tools based on context (excluding submitTemplate, which we wrap for UI)
  const baseTools =
    enableTools &&
    getToolsForContext({
      organizationId,
      templateId,
      enableValidation: true,
      includeSubmit: false,
    });

  const toolCount = baseTools ? Object.keys(baseTools).length + 1 : 1; // +1 for submitTemplate UI tool

  logger.info("[AI V2] Tools configured", {
    toolCount,
    tools: baseTools
      ? [...Object.keys(baseTools), "submitTemplate"]
      : ["submitTemplate"],
  });

  // Build system prompt with React Email instructions
  // Note: Brand context is fetched on-demand via getBrandSettings() tool
  const basePrompt = buildReactEmailPrompt("");
  const systemPrompt = `${basePrompt}

Your task is to generate a React Email template. Follow these steps:

1. **Gather Context** (if needed):
   - Use getBrandSettings() to get brand colors, fonts, and voice
   - Use getTemplateContext() if regenerating an existing template

2. **Generate Template**:
   - Create professional, engaging email content
   - Follow brand guidelines strictly
   - Use only @react-email/components
   - Ensure code is syntactically valid

3. **Submit Template**:
   - Once generated, CALL the submitTemplate() tool with:
     * subject: Compelling email subject line
     * previewText: Preview text for inbox
     * reactEmailCode: Complete React Email component code
     * tone: Email tone (optional)
     * keyPoints: Key benefits/points (optional)

IMPORTANT: You MUST call submitTemplate() with the final template. Do not just output the template as text.`;

  // Create a UI message stream so we can inject custom data parts
  const stream = createUIMessageStream<TemplateUiMessage>({
    execute: ({ writer }) => {
      const tools = enableTools
        ? ({
            ...baseTools,
            submitTemplate: createSubmitTemplateUiTool(writer),
          } as const)
        : undefined;

      const result = streamText({
        model: openrouter(modelName),
        system: systemPrompt,
        messages: convertToModelMessages(messages),
        tools,
        stopWhen: stepCountIs(15),
        temperature: 0.7,

        onStepFinish: ({ text, toolCalls, usage }) => {
          logger.info("[AI V2] Step finished", {
            textLength: text.length,
            toolCallCount: toolCalls?.length || 0,
            tokensUsed: usage?.totalTokens,
            reasoningTokens: usage?.reasoningTokens,
          });
        },

        onFinish: ({ text, toolCalls, usage }) => {
          const durationMs = Date.now() - startTime;
          logger.info("[AI V2] Generation complete", {
            durationMs,
            conversationLength: text.length,
            totalTokens: usage?.totalTokens,
            reasoningTokens: usage?.reasoningTokens,
            toolCallCount: toolCalls?.length || 0,
            organizationId,
            templateId,
            userId: metadata?.userId,
          });
        },

        onError: ({ error }) => {
          logger.error("[AI V2] Stream error", {
            error: error instanceof Error ? error.message : String(error),
            organizationId,
            templateId,
          });
        },
      });

      writer.merge(
        result.toUIMessageStream({
          sendReasoning: enableReasoning,
        })
      );
    },
  });

  // Return UI message stream response (for useChat/frontend)
  return createUIMessageStreamResponse({ stream });
}
