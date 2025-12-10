# AI V2 – UI Message Stream Plan

> **Goal**: Replace the broken V2 data-stream/SSE client with a working, AI-SDK-native **UI message stream** architecture (like the shared-chat example) while keeping V1 intact.

---

## 1. Current State & Problem

### 1.1 Backend (V2)

- `packages/api/src/lib/ai-v2-streaming.ts`
  - Uses `streamText({ tools })` and returns `result.toUIMessageStreamResponse({ sendReasoning })`.
  - This is the **UI message stream protocol** intended for `useChat` / `DefaultChatTransport`.
- `apps/web/src/app/api/template/generate/route.ts`
  - In V2 branch, calls `streamTemplateV2(...)` and returns its response.
  - V1 fallback still uses `aiClient.streamStructured(...).toTextStreamResponse()`.

### 1.2 Frontend (V2)

- `apps/web/src/hooks/use-stream-template-v2.ts`
  - Manually calls `fetch('/api/template/generate')`, reads `response.body.getReader()`, and parses `data: { ... }` SSE lines.
  - Expects custom events like:
    - `{ type: 'reasoning', text: ... }`
    - `{ type: 'tool-call', toolName, args }`
  - This matches the **older data-stream plan** (from `AI_V2_IMPLEMENTATION_PLAN_REVISED.md`), not the current UI message stream.

- `TemplateProvider.tsx`
  - Uses `useStreamTemplateV2` in `streamV2` / `regenerationV2` and chooses between V1/V2:
    - `const generateStream = useV2Mode ? streamV2.generate : streamV1.generate;`
  - V2 state (reasoning, toolCalls, template) is fed from `useStreamTemplateV2`, which never sees the actual UI messages.

### 1.3 Consequence

- **Backend and frontend are speaking different protocols.**
- V2 never actually consumes the `UIMessage` stream from `streamText`, so V2 “reasoning + tools” is effectively non-functional.

---

## 2. Target Architecture (Modeled on Shared Chat Example)

### 2.1 Backend

- Use `streamText` with tools and wrap it in a **UI message stream**:
  - `createUIMessageStream` + `createUIMessageStreamResponse` (or `toUIMessageStreamResponse`).
  - Inject a UI-aware `submitTemplate` tool that writes `data-submitTemplate` parts into the stream.
- Continue using feature flags / rollout and V1 fallback as today.

### 2.2 Frontend

- Replace `useStreamTemplateV2` SSE client with:
  - A single shared `Chat<TemplateUiMessage>` instance (similar to shared-chat’s `ChatProvider`).
  - `useChat({ chat })` from `@ai-sdk/react` to consume the UI message stream.
  - Logic that reads `message.parts` and extracts:
    - `reasoning` parts → reasoning timeline.
    - `tool-call` parts → tool activity.
    - `data-submitTemplate` parts → final `TemplateOutput` (subject, previewText, reactEmailCode, etc.).
- `TemplateProvider` continues to own saving to DB / state transitions; it just derives its V2 data from `messages` instead of a custom SSE hook.

---

## 3. Backend Changes

### 3.1 Define UI Message Types

In `ai-v2-streaming.ts`, define a typed UI message model (parallel to shared-chat’s `MyUiMessage`):

```ts
import type { UIMessage, UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { submitTemplateSchema } from "./tools/submit-template";

export type TemplateSubmitPart = z.infer<typeof submitTemplateSchema>;

export type TemplateDataTypes = {
  submitTemplate: TemplateSubmitPart;
};

export type TemplateUiMessage = UIMessage<
  { organizationId?: string; templateId?: string },
  TemplateDataTypes,
  any
>;
```

### 3.2 UI-Aware `submitTemplate` Tool

Wrap the existing `submitTemplateTool` into a UI-streaming tool that writes `data-submitTemplate` parts:

```ts
import { tool } from "ai";
import type { UIMessageStreamWriter } from "ai";
import { submitTemplateSchema } from "./tools/submit-template";
import type { TemplateUiMessage } from "./ai-v2-streaming-types";

export function createSubmitTemplateTool(
  writer: UIMessageStreamWriter<TemplateUiMessage>
) {
  return tool({
    name: "submitTemplate",
    description: "Submit the final React Email template.",
    inputSchema: submitTemplateSchema,
    async execute(input) {
      writer.write({
        type: "data-submitTemplate",
        id: "template", // or generateId() if we ever support multiple
        data: {
          subject: input.subject,
          previewText: input.previewText,
          reactEmailCode: input.reactEmailCode,
          tone: input.tone,
          keyPoints: input.keyPoints,
        },
      });

      // Optionally still log + return as before
      return { success: true };
    },
  });
}
```

> Note: We keep the existing `submitTemplateTool` for non-UI use if needed, but V2 streaming should prefer this UI-aware wrapper.

### 3.3 Build UI Message Stream in `streamTemplateV2`

Update `streamTemplateV2` to construct a `createUIMessageStream` and inject `createSubmitTemplateTool` alongside other tools:

```ts
import {
  streamText,
  stepCountIs,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { createSubmitTemplateTool } from "./tools/submit-template-ui";
import { getToolsForContext } from "./tools";

export async function streamTemplateV2(
  options: StreamTemplateV2Options,
  model?: string
) {
  const {
    prompt,
    organizationId,
    templateId,
    imageUrls,
    enableReasoning = true,
    enableTools = true,
    metadata,
  } = options;

  const modelName = model || "anthropic/claude-3.5-sonnet";

  const baseTools = enableTools
    ? getToolsForContext({
        organizationId,
        templateId,
        enableValidation: true,
        includeSubmit: false, // we inject UI-aware submit below
      })
    : undefined;

  const stream = createUIMessageStream<TemplateUiMessage>({
    execute: ({ writer }) => {
      const result = streamText({
        model: openrouter(modelName),
        system: /* existing systemPrompt */ systemPrompt,
        messages: buildMessages(prompt, imageUrls),
        tools: enableTools
          ? {
              ...baseTools,
              submitTemplate: createSubmitTemplateTool(writer),
            }
          : undefined,
        stopWhen: stepCountIs(5),
        temperature: 0.7,
      });

      writer.merge(
        result.toUIMessageStream({
          sendReasoning: enableReasoning,
        })
      );
    },
  });

  return createUIMessageStreamResponse({ stream });
}
```

The V2 branch in `apps/web/src/app/api/template/generate/route.ts` can remain conceptually the same: it calls `streamTemplateV2(...)` and returns the response.

---

## 4. Frontend Changes

### 4.1 Remove `useStreamTemplateV2` SSE Hook

- `apps/web/src/hooks/use-stream-template-v2.ts` currently:
  - Manually consumes SSE lines and expects `{ type: 'reasoning' }` / `{ type: 'tool-call' }` payloads.
  - This conflicts with the UI message stream now produced by V2.
- **Plan**: Deprecate/remove this hook for V2 and replace it with `Chat<TemplateUiMessage> + useChat`.

### 4.2 Create Template Chat Utilities

Add a small helper to create and use a typed chat instance (can live in `apps/web/src/hooks` or a new `template-chat.ts`):

```ts
"use client";

import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { TemplateUiMessage } from "@mocah/api/lib/ai-v2-streaming";

export function createTemplateChat() {
  return new Chat<TemplateUiMessage>({
    transport: new DefaultChatTransport({
      api: "/api/template/generate",
    }),
  });
}

export function useTemplateChat(chat: Chat<TemplateUiMessage>) {
  return useChat({ chat });
}
```

### 4.3 Wire Chat into `TemplateProvider`

Inside `TemplateProvider.tsx`:

1. **Create and own a single chat instance**:

```ts
const [chat] = useState(() => createTemplateChat());
const { messages, sendMessage, status } = useTemplateChat(chat);
```

2. **Replace V2 `generate`/`regenerate` calls** with `sendMessage`:

```ts
async function generateTemplateV2(prompt: string, imageUrls?: string[]) {
  sendMessage({
    text: prompt,
    metadata: {
      organizationId: activeOrganization?.id,
      templateId,
      mode: "v2",
      // imageUrls can remain in body of the POST for now, or later be
      // moved into messages if we switch to message-based API payloads
    },
  });
}

// In the V1/V2 switch:
const generateStream = useV2Mode ? generateTemplateV2 : streamV1.generate;
```

3. **Derive template + reasoning from `messages`** and push into state using existing completion logic:

```ts
useEffect(() => {
  const reasoningParts: { text: string; timestamp: number }[] = [];
  const toolCalls: { toolName: string; timestamp: number; args?: any }[] = [];
  let latestTemplate: TemplateOutput | null = null;

  for (const m of messages) {
    for (const part of m.parts ?? []) {
      if (part.type === "reasoning") {
        reasoningParts.push({ text: part.text, timestamp: Date.now() });
      }
      if (part.type === "tool-call") {
        toolCalls.push({
          toolName: part.toolName,
          timestamp: Date.now(),
          args: part.args,
        });
      }
      if (part.type === "data-submitTemplate") {
        latestTemplate = {
          subject: part.data.subject,
          previewText: part.data.previewText,
          reactEmailCode: part.data.reactEmailCode,
          tone: part.data.tone,
          keyPoints: part.data.keyPoints,
        };
      }
    }
  }

  setState(prev => ({
    ...prev,
    reasoning: reasoningParts.length ? reasoningParts : null,
    toolCalls: toolCalls.length ? toolCalls : null,
  }));

  if (latestTemplate) {
    // Reuse the existing V2 onComplete logic to save template to DB
    // and update currentTemplate/reactEmailCode/etc.
  }
}, [messages]);
```

4. **Keep V1 path untouched**:

- `useStreamTemplate` and V1 endpoints continue to work as they do today.
- V2 only kicks in when `useV2Mode` is true and feature flags select `v2`.

---

## 5. Documentation Alignment

- `AI_V2_IMPLEMENTATION_PLAN_REVISED.md` and `ai-stream-text-migration.md` currently describe a **data stream** approach (`createDataStreamResponse`, `dataStream.writeData({ type: 'final-template' })`).
- The actual code has already moved toward **UI message streams** via `toUIMessageStreamResponse`.

**Decision**:

- Treat the data-stream sections in those docs as historical and explicitly document that V2 now uses:
  - `streamText` + tools + **UI message stream**.
  - `Chat<TemplateUiMessage>` + `useChat` on the frontend.
  - Custom `data-submitTemplate` parts instead of bespoke `{ type: 'final-template' }` events.

---

## 6. Rollout Steps

1. **Backend**:
   - Add `TemplateUiMessage` types.
   - Implement `createSubmitTemplateTool(writer)` and update `streamTemplateV2` to use `createUIMessageStream`.
2. **Frontend**:
   - Implement `createTemplateChat` + `useTemplateChat` helpers.
   - Replace `useStreamTemplateV2` usage in `TemplateProvider` with the chat-based approach.
   - Remove or clearly deprecate `useStreamTemplateV2` to avoid confusion.
3. **Docs**:
   - Add a short note at the top of `AI_V2_IMPLEMENTATION_PLAN_REVISED.md` pointing to this file as the **authoritative plan for V2 UI streaming**.
4. **Testing**:
   - With feature flags forcing `v2`, verify:
     - Reasoning stream appears in Template UI.
     - Tool calls (brand settings, validation, submitTemplate) are logged and reflected in `toolCalls` state.
     - Final template is saved correctly and V1 fallback still works when forced.
