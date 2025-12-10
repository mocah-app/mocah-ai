### AI Streaming Migration Plan: Enhanced AI Capabilities (REVISED)

This document outlines how to enhance Mocah's AI streaming stack with reasoning and tool-calling capabilities while **preserving and improving** the existing implementation.

> **🔴 CRITICAL FINDING (UPDATED)**: After comprehensive research of AI SDK documentation:
> 1. `streamObject` does **NOT** support tool calling
> 2. `experimental_useObject` does **NOT** work with `streamText` + `experimental_output`
> 3. **Correct Approach**: Use `streamText` with tools + reasoning, then `generateObject` in `onFinish` for final structured output
> 4. **Frontend**: Use `useChat` with data stream protocol (NOT `experimental_useObject`)

---

### 1. Current Implementation Overview

- **Frontend hook**: `useStreamTemplate`
  - Located in `apps/web/src/hooks/use-stream-template.ts`.
  - Uses `experimental_useObject` from `@ai-sdk/react` against `/api/template/generate`.
  - Streams a typed `reactEmailGenerationSchema` object with:
    - Client-side retry & exponential backoff.
    - Basic error handling and completion validation (subject + `reactEmailCode`).

- **Server AI wrapper**: `aiClient` in `packages/api/src/lib/ai.ts`
  - `generateStructured` → `generateObject` (non-streaming structured JSON).
  - `generateText` → `generateText` (non-streaming text).
  - `streamStructured` → `streamObject` with:
    - Multi-modal input via `imageUrls`.
    - Retry, schema name/description, JSON repair.
    - Logging for start, error, and finish.
  - `streamText` → `streamText` with **simple options** (prompt + logging only).

- **Docs**: `dev-docs/ai-stream.md`
  - Upstream AI SDK reference for `streamObject`, `streamText`, and core React hooks.
  - Will be enhanced with Mocah-specific patterns and examples.

**Current Capabilities**:
- ✅ Structured output via `streamObject` with Zod validation
- ✅ Multi-modal input (text + images)
- ✅ Client-side retry with exponential backoff
- ✅ Comprehensive error logging

**Target Enhancements**:
- 🎯 Tool calling (brand settings, template context, validation) - **V2 only** (requires `streamText`)
- 🎯 Reasoning support for complex generation tasks - **Both V1 and V2** (`streamObject` and `streamText` both support reasoning)
- 🎯 Enhanced conversation context via messages array - **Both V1 and V2**
- 🎯 Richer telemetry and observability - **Both V1 and V2**

**Constraints**:
- Existing template streaming must **keep working** during migration.
- We want to **add reasoning** and **tool calling** in a controlled, configurable way.
- Maintain strong typing and validation guarantees.

---

### 2. High-Level Migration Goals

- **Enhanced `streamObject` as the primary approach** for template generation (maintains structured output guarantees).
- **Keep existing `streamObject`-based flows working** (v1 path) without disruption.
- **Introduce reasoning** (for models that support it) with safe defaults and config.
- **Introduce tool calling** to let the model:
  - Fetch and respect brand/theme configuration.
  - Inspect existing templates when regenerating.
  - Validate/normalize generated email code.
- Maintain a **thin, opinionated `aiClient`** wrapper so callers don't depend on raw `ai` signatures.
- **Comprehensive observability** to measure improvement and guide rollout decisions.

#### Architecture Decision: Hybrid Streaming + Structured Output

**Research Findings**:
1. `streamObject` does **NOT** support tool calling
2. `streamText` + `experimental_output` requires custom frontend parsing (NOT compatible with `experimental_useObject`)
3. **Best Practice**: Separate concerns - use `streamText` for tools/reasoning, `generateObject` for final output

**V2 Architecture (CORRECTED)**:

```typescript
// Backend: Stream conversation with tools, generate structured output in onFinish
return createDataStreamResponse({
  async execute(dataStream) {
    const result = streamText({
      model: openrouter('claude-sonnet-4.5'),
      messages: buildMessages(prompt, imageUrls),
      
      // Tools for dynamic context
      tools: {
        getBrandSettings: getBrandSettingsTool,
        getTemplateContext: getTemplateContextTool,
        validateEmailCode: validateEmailCodeTool,
      },
      
      // Stream reasoning to frontend
      onChunk: ({ chunk }) => {
        if (chunk.type === 'reasoning') {
          dataStream.writeData({ type: 'reasoning', text: chunk.text });
        }
        if (chunk.type === 'tool-call') {
          dataStream.writeData({ type: 'tool-status', tool: chunk.toolName, status: 'executing' });
        }
      },
      
      // Generate final structured output AFTER tools complete
      onFinish: async ({ text, toolResults }) => {
        const structuredOutput = await generateObject({
          model: openrouter('claude-sonnet-4.5'),
          schema: reactEmailGenerationSchema,
          prompt: `Based on this generation: ${text}\nWith context: ${JSON.stringify(toolResults)}\nCreate final template:`,
        });
        
        dataStream.writeData({
          type: 'final-template',
          template: structuredOutput.object,
        });
      },
    });
    
    // Merge text stream into data stream
    result.mergeIntoDataStream(dataStream);
  },
});

// Frontend: Use useChat with data stream protocol
const { messages, data, sendMessage } = useChat({
  api: '/api/template/generate',
  onData: (streamData) => {
    if (streamData.type === 'final-template') {
      setFinalTemplate(streamData.template);
    }
  },
});
```

**Why this approach**:
- ✅ Tool calling works natively (`streamText` supports tools)
- ✅ Reasoning streams properly (via data stream protocol)
- ✅ Structured output is type-safe (`generateObject` with Zod validation)
- ✅ Frontend gets reasoning + tool activity + final result
- ✅ Uses stable AI SDK APIs (NOT experimental)
- ✅ Clean separation of concerns

**Trade-offs**:
- ⚠️ Different frontend hook (`useChat` instead of `experimental_useObject`)
- ⚠️ Structured output generated after streaming (not during)
- ⚠️ More backend code (but cleaner architecture)

**V1 Path (No Tools)** - Keep as-is:
- Backend: `streamObject` → `toTextStreamResponse()`
- Frontend: `experimental_useObject`
- Works perfectly for simple structured streaming

**Decision**: Use hybrid approach - `streamText` (tools + reasoning) → `generateObject` (structured output) → `useChat` (frontend consumption).

---

### 3. Phased Migration Plan

#### Phase 0 – Baseline & Feature Flagging

- **Keep `aiClient.streamStructured` + `useStreamTemplate` as-is** (v1 path).
- Add a **feature flag / mode** for template streaming, e.g.:
  - Server: `USE_STREAM_TEMPLATE_V2` env or per-request flag.
  - Client: optional `mode?: "v1" | "v2"` in `useStreamTemplate` options.
- Ensure logging clearly distinguishes `v1` vs `v2` traffic.

#### Phase 1 – Backend: Implement Data Stream with Tools (REVISED)

Create a new V2 endpoint that uses `streamText` for tools/reasoning, then generates structured output in `onFinish`:

```typescript
// Enhanced configuration types
interface ReasoningConfig {
  enabled: boolean;
  budgetTokens?: number;
  mode?: 'planning' | 'validation' | 'full';
  // planning: reason about structure before generating
  // validation: reason about correctness after generating
  // full: both phases
}

interface StreamTextStructuredOptions<T extends z.ZodType> {
  schema: T;                    // Zod schema for structured output
  messages?: Message[];         // Conversation context
  prompt?: string;              // Or simple prompt
  reasoning?: ReasoningConfig;
  tools?: ToolSet;
  maxSteps?: number;            // Replaces maxToolRoundTrips (includes output step)
  metadata?: Record<string, unknown>;
  imageUrls?: string[];         // Multi-modal support
  system?: string;              // System prompt
  temperature?: number;
}

// New method in aiClient
export const aiClient = {
  // ... existing methods (streamStructured, generateText, etc.) ...
  
  /**
   * Stream text with structured output and tool calling support
   * Uses streamText with experimental_output under the hood
   */
  streamTextWithStructuredOutput<T extends z.ZodType>(
    options: StreamTextStructuredOptions<T>,
    model?: string
  ): ReturnType<typeof streamText> {
    const modelName = model || DEFAULT_MODEL;
    
    // Build messages array with multi-modal support
    const messages = buildMessagesArray(options);
    
    return streamText({
      model: openrouter(modelName),
      messages,
      system: options.system,
      experimental_output: Output.object({
        schema: options.schema,
      }),
      tools: options.tools,
      maxSteps: options.maxSteps ?? 5, // Account for tool calls + output step
      temperature: options.temperature ?? 0.7,
      // Logging callbacks
      onFinish: ({ usage, response }) => {
        logger.info('AI text stream with structured output completed', {
          component: 'ai',
          action: 'streamTextWithStructuredOutput',
          model: modelName,
          tokensUsed: usage.totalTokens,
          reasoningTokens: usage.reasoningTokens,
          steps: response.steps?.length ?? 0,
        });
      },
    });
  },
};

function buildMessagesArray(options: StreamTextStructuredOptions<any>): Message[] {
  if (options.messages) {
    return options.messages;
  }
  
  // Convert simple prompt + images to messages array
  const content: UserContent = [
    { type: 'text', text: options.prompt! },
  ];
  
  if (options.imageUrls && options.imageUrls.length > 0) {
    for (const imageUrl of options.imageUrls) {
      content.push({ type: 'image', image: imageUrl });
    }
  }
  
  return [{ role: 'user', content }];
}
```

**Implementation notes**:
- Keep existing `streamStructured` (v1) unchanged
- Add new method specifically for v2 with tool calling
- `maxSteps` must account for tool calls + final output step (typically 3-5)
- When using `experimental_output`, structured output generation is a separate step
- Add richer logging:
  - Reasoning tokens used (if supported by model)
  - Number of steps/tool calls
  - Tool call latency tracking

#### Phase 2 – Define Core Tools for Mocah

Design tools as **small, composable server-side functions** in `packages/api/src/lib/tools/`.

##### 2.1 Tool Implementations

```typescript
// packages/api/src/lib/tools/brand-settings.ts
import { tool } from 'ai';
import { z } from 'zod';
import { getBrandKitByOrgId } from '@mocah/db/queries/brand';

export const getBrandSettingsTool = tool({
  description: `Fetch brand style guidelines and design tokens for generating on-brand emails.
Returns colors, fonts, logo, tone, and style preferences to ensure email matches organization branding.`,
  parameters: z.object({
    organizationId: z.string().describe('The organization ID to fetch brand settings for'),
  }),
  execute: async ({ organizationId }, { abortSignal }) => {
    // Fetch from DB with caching
    const brandKit = await getBrandKitByOrgId(organizationId);
    
    if (!brandKit) {
      return {
        success: false,
        message: 'No brand settings found. Use default professional styling.',
      };
    }
    
    return {
      success: true,
      brand: {
        colors: {
          primary: brandKit.primaryColor,
          accent: brandKit.accentColor,
          background: brandKit.backgroundColor,
          text: brandKit.textPrimaryColor,
        },
        typography: {
          fontFamily: brandKit.fontFamily,
        },
        tone: brandKit.brandVoice,
        logo: brandKit.logo,
        companyName: brandKit.companyName,
      },
    };
  },
});

// packages/api/src/lib/tools/template-context.ts
export const getTemplateContextTool = tool({
  description: `Get existing template details for regeneration or iteration.
Provides current subject, code, and metadata to help understand what to preserve or modify.`,
  parameters: z.object({
    templateId: z.string().describe('The template ID to fetch context for'),
  }),
  execute: async ({ templateId }) => {
    const template = await getTemplateById(templateId);
    
    if (!template) {
      return {
        success: false,
        message: 'Template not found. Treat as new generation.',
      };
    }
    
    return {
      success: true,
      template: {
        subject: template.subject,
        previewText: template.previewText,
        codeSnippet: template.reactEmailCode.slice(0, 500), // First 500 chars
        audience: template.targetAudience,
        campaignType: template.category,
      },
    };
  },
});

// packages/api/src/lib/tools/validate-email.ts
export const validateEmailCodeTool = tool({
  description: `Validate React Email code for syntax and component usage compliance.
Returns structured errors with line numbers and suggested fixes for any issues found.`,
  parameters: z.object({
    code: z.string().describe('The React Email component code to validate'),
  }),
  execute: async ({ code }) => {
    // Use existing validation logic
    const errors = await validateReactEmailCode(code);
    
    if (errors.length === 0) {
      return {
        isValid: true,
        message: 'Code is valid and follows React Email best practices.',
      };
    }
    
    return {
      isValid: false,
      errors: errors.map(e => ({
        line: e.line,
        message: e.message,
        severity: e.severity,
        suggestion: e.suggestedFix,
      })),
    };
  },
});
```

##### 2.2 Tool Registry

```typescript
// packages/api/src/lib/tools/index.ts
export const mocahToolRegistry = {
  getBrandSettings: getBrandSettingsTool,
  getTemplateContext: getTemplateContextTool,
  validateEmailCode: validateEmailCodeTool,
} as const;

export type MocahToolName = keyof typeof mocahToolRegistry;
```

**Implementation guidelines**:
- All tools must be idempotent and safe to call multiple times
- Validate tool input with Zod, return structured errors
- Log failures and provide degraded-but-safe fallbacks
- Use efficient DB queries with appropriate indexes
- Consider request-scoped caching for brand settings

#### Phase 2.5 – Observability & Telemetry

Before rolling out v2, establish metrics for comparison.

##### Key Metrics

```typescript
// packages/api/src/lib/telemetry/ai-metrics.ts
interface AIGenerationMetrics {
  // Performance
  generationTimeMs: number;
  tokenUsage: {
    prompt: number;
    completion: number;
    reasoning?: number;  // Separate tracking
    total: number;
  };
  
  // Tool calling
  toolCalls: {
    name: string;
    latencyMs: number;
    success: boolean;
  }[];
  
  // Quality signals
  regenerationRequested: boolean;
  immediateEdit: boolean;
  
  // Context
  model: string;
  version: 'v1' | 'v2';
  organizationId: string;
  templateType?: string;
}
```

##### Logging Strategy

- Log all tool calls with timing and success/failure
- Log reasoning token usage separately from generation tokens
- Aggregate metrics by model, org, and template type
- Create dashboard for monitoring v1 vs v2 performance

##### A/B Testing Framework

```typescript
// Determine which version to use based on org or random assignment
function getTemplateGenerationVersion(
  organizationId: string,
  featureFlags: FeatureFlags
): 'v1' | 'v2' {
  // Explicit override
  if (featureFlags.forceV2) return 'v2';
  if (featureFlags.forceV1) return 'v1';
  
  // Gradual rollout by org (stable assignment)
  const hash = hashOrganizationId(organizationId);
  const rolloutPercentage = featureFlags.v2RolloutPercentage ?? 0;
  
  return (hash % 100) < rolloutPercentage ? 'v2' : 'v1';
}
```

#### Phase 3 – Template Generation v2 with `streamText` + `experimental_output`

Introduce a **new server-side helper** `streamTemplateV2` using `streamText` with `experimental_output`:

```typescript
// packages/api/src/lib/ai-v2.ts
import { streamText, Output, tool } from 'ai';
import { z } from 'zod';

interface StreamTemplateV2Options {
  prompt: string;
  organizationId?: string;
  templateId?: string;
  imageUrls?: string[];
  enableReasoning?: boolean;
  reasoningBudget?: number;
  enableTools?: boolean;
  metadata?: Record<string, unknown>;
}

export async function streamTemplateV2(
  schema: typeof reactEmailGenerationSchema,
  options: StreamTemplateV2Options,
  model?: string
) {
  const {
    prompt,
    organizationId,
    templateId,
    imageUrls,
    enableReasoning = true,
    reasoningBudget = 256,
    enableTools = true,
    metadata = {},
  } = options;

  const modelName = model || TEMPLATE_GENERATION_MODEL;

  // Build system prompt with reasoning guidance
  const systemPrompt = buildSystemPromptWithReasoning(enableReasoning);

  // Build user message with multi-modal content
  const userContent: UserContent = [{ type: 'text', text: prompt }];
  
  if (imageUrls && imageUrls.length > 0) {
    for (const imageUrl of imageUrls) {
      userContent.push({ type: 'image', image: imageUrl });
    }
  }

  // Configure tools based on context
  const tools = enableTools
    ? {
        getBrandSettings: organizationId ? mocahToolRegistry.getBrandSettings : undefined,
        getTemplateContext: templateId ? mocahToolRegistry.getTemplateContext : undefined,
        validateEmailCode: mocahToolRegistry.validateEmailCode,
      }
    : undefined;

  // Filter out undefined tools
  const activeTools = tools 
    ? Object.fromEntries(
        Object.entries(tools).filter(([_, tool]) => tool !== undefined)
      )
    : undefined;

  logger.info('AI template generation v2 initiated', {
    component: 'ai-v2',
    action: 'streamTemplateV2',
    model: modelName,
    enableTools,
    enableReasoning,
    toolCount: activeTools ? Object.keys(activeTools).length : 0,
  });

  // Use streamText with experimental_output for structured output + tool calling
  return streamText({
    model: openrouter(modelName),
    system: systemPrompt,
    messages: [
      { role: 'user', content: userContent },
    ],
    experimental_output: Output.object({
      schema,
    }),
    tools: activeTools,
    stopWhen: stepCountIs(5), // Allow up to 5 steps (tool calls + output generation)
    temperature: 0.7,
    onFinish: ({ usage, response }) => {
      logger.info('AI template generation v2 completed', {
        component: 'ai-v2',
        action: 'streamTemplateV2',
        model: modelName,
        tokensUsed: usage.totalTokens,
        reasoningTokens: usage.reasoningTokens,
        steps: response.steps?.length ?? 0,
        toolCallCount: response.steps?.filter(s => s.toolCalls?.length > 0).length ?? 0,
      });
    },
  });
}
```

##### System Prompt with Reasoning

```typescript
function buildSystemPromptWithReasoning(enabled: boolean): string {
  const basePrompt = getReactEmailPrompt({ brandKit: null }); // Base rules
  
  if (!enabled) return basePrompt;
  
  return `${basePrompt}

REASONING GUIDANCE:
Before generating the template, consider:
1. What is the primary goal of this email? (inform, convert, onboard, etc.)
2. What audience segment is this for? (adjust tone accordingly)
3. What brand guidelines should I follow? (use getBrandSettings tool if available)
4. For regenerations: What should I preserve vs. change? (use getTemplateContext tool)
5. What's the optimal structure for this email type?

After generating, verify:
- All React Email component rules followed
- Brand colors and tone applied correctly
- CTA is clear and compelling
- Mobile-responsive layout

You may use validateEmailCode tool to check your generated code.`;
}
```

##### API Endpoint Integration

```typescript
// apps/web/src/app/api/template/generate/route.ts
export async function POST(req: Request) {
  const { 
    prompt, 
    organizationId, 
    templateId, 
    imageUrls, 
    mode = 'v1',
    enableReasoning = true,
    enableTools = true,
  } = await req.json();
  
  // Route to appropriate version
  if (mode === 'v2') {
    const stream = await streamTemplateV2(
      reactEmailGenerationSchema,
      {
        prompt,
        organizationId,
        templateId,
        imageUrls,
        enableReasoning,
        enableTools,
      }
    );
    
    // streamText uses textStream or toDataStreamResponse
    return stream.toDataStreamResponse();
  }
  
  // V1 path (existing - uses streamObject)
  const stream = aiClient.streamStructured(
    reactEmailGenerationSchema,
    prompt,
    TEMPLATE_GENERATION_MODEL,
    { imageUrls, organizationId }
  );
  
  return stream.toDataStreamResponse();
}
```

**Important Notes for V2 Integration**:

1. **Accessing Structured Output**: With `streamText` + `experimental_output`, the structured object is available through `response.experimental_output`:

```typescript
// Server-side access after streaming completes
const result = await streamTemplateV2(schema, options);
for await (const chunk of result.fullStream) {
  // Process chunks
}
const output = result.experimental_output; // Typed according to schema
```

2. **Client-Side Consumption**: You may need to adjust the frontend hook to handle `streamText` responses differently than `streamObject`. The AI SDK's `experimental_useObject` might not work directly with `streamText` + `experimental_output`. Consider:
   - Using `useChat` or custom SSE handler
   - Or continue using `experimental_useObject` if compatible (test this)
   - Fallback: Parse structured data from text stream

We'll address this in Phase 4.

#### Phase 4 – Frontend Hook Evolution

**Challenge**: `experimental_useObject` is designed for `streamObject`, not `streamText` with `experimental_output`. We need to test compatibility or create a custom hook.

##### Option A: Test `experimental_useObject` Compatibility (Preferred)

```typescript
// apps/web/src/hooks/use-stream-template.ts (additions)
interface UseStreamTemplateOptions {
  organizationId?: string;
  templateId?: string;
  onComplete?: (template: TemplateGenerationOutput) => void;
  onError?: (error: Error) => void;
  maxRetries?: number;
  apiEndpoint?: string;
  
  // V2 options
  mode?: 'v1' | 'v2';  // Default to v1 initially
  enableReasoning?: boolean;  // Only honored in v2
  enableTools?: boolean;  // Only honored in v2
}

export function useStreamTemplate(options: UseStreamTemplateOptions) {
  const {
    mode = 'v1',
    enableReasoning = true,
    enableTools = true,
    ...baseOptions
  } = options;
  
  // Try to reuse experimental_useObject for v2
  // If it works with streamText + experimental_output, great!
  // If not, we'll need Option B
  const { object, submit, error, isLoading, stop } = useObject({
    api: apiEndpoint,
    schema: reactEmailGenerationSchema,
    onFinish: ({ object: finalObject, error: finishError }) => {
      // ... existing retry logic ...
    },
  });
  
  const generate = useCallback(
    async (prompt: string, imageUrls?: string[]) => {
      setIsGenerating(true);
      setRetryCount(0);
      lastPromptRef.current = prompt;

      const body: Record<string, any> = {
        prompt,
        mode,  // Pass version to API
      };
      
      // V2-specific options
      if (mode === 'v2') {
        body.enableReasoning = enableReasoning;
        body.enableTools = enableTools;
      }
      
      if (templateId) {
        body.templateId = templateId;
      } else if (organizationId) {
        body.organizationId = organizationId;
      }

      if (imageUrls && imageUrls.length > 0) {
        body.imageUrls = imageUrls;
      }
      
      lastBodyRef.current = body;
      await submit(body);
    },
    [submit, organizationId, templateId, mode, enableReasoning, enableTools]
  );
  
  // Return same interface (backward compatible)
  return {
    partialTemplate: object,
    generate,
    cancel,
    isGenerating: isGenerating || isLoading,
    error,
    retryCount,
  };
}
```

##### Option B: Custom Hook for V2 (If Option A Fails)

If `experimental_useObject` doesn't work with v2 (streamText + experimental_output), create a custom SSE handler:

```typescript
// apps/web/src/hooks/use-stream-template-v2.ts
import { useCallback, useState } from 'react';

export function useStreamTemplateV2(options: UseStreamTemplateOptions) {
  const [partialTemplate, setPartialTemplate] = useState<Partial<TemplateGenerationOutput>>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  
  const generate = useCallback(async (prompt: string, imageUrls?: string[]) => {
    setIsGenerating(true);
    setError(undefined);
    setPartialTemplate(undefined);
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          organizationId,
          templateId,
          imageUrls,
          mode: 'v2',
          enableReasoning,
          enableTools,
        }),
      });
      
      if (!response.ok) throw new Error('Generation failed');
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Parse AI SDK data stream protocol
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('0:')) {
            // Text chunk
            continue;
          } else if (line.startsWith('8:')) {
            // Structured data (experimental_output)
            const data = JSON.parse(line.slice(2));
            setPartialTemplate(data);
          }
        }
      }
      
      onComplete?.(partialTemplate as TemplateGenerationOutput);
    } catch (err) {
      setError(err as Error);
      onError?.(err as Error);
    } finally {
      setIsGenerating(false);
    }
  }, [/* deps */]);
  
  return {
    partialTemplate,
    generate,
    isGenerating,
    error,
  };
}
```

**Action Item for Phase 4**:
1. Test if `experimental_useObject` works with v2 API (streamText + experimental_output)
2. If yes, use Option A (minimal changes)
3. If no, implement Option B (custom SSE handler)
4. Document findings and update this section accordingly

##### UI Integration (Optional Debug Controls)

```typescript
// For internal testing/debugging
function TemplateGeneratorDebugPanel() {
  const [mode, setMode] = useState<'v1' | 'v2'>('v1');
  const [enableReasoning, setEnableReasoning] = useState(true);
  const [enableTools, setEnableTools] = useState(true);
  
  const { generate, isGenerating } = useStreamTemplate({
    organizationId,
    mode,
    enableReasoning,
    enableTools,
  });
  
  return (
    <div>
      <select value={mode} onChange={e => setMode(e.target.value as any)}>
        <option value="v1">V1 (Current)</option>
        <option value="v2">V2 (Enhanced)</option>
      </select>
      
      {mode === 'v2' && (
        <>
          <label>
            <input type="checkbox" checked={enableReasoning} onChange={e => setEnableReasoning(e.target.checked)} />
            Enable Reasoning
          </label>
          <label>
            <input type="checkbox" checked={enableTools} onChange={e => setEnableTools(e.target.checked)} />
            Enable Tools
          </label>
        </>
      )}
    </div>
  );
}
```

#### Phase 5 – Rollout & Risk Mitigation

##### 5.1 Gradual Rollout Strategy

1. **Week 1-2: Internal testing**
   - Enable v2 for Mocah team's organization only
   - Gather qualitative feedback on quality improvements
   - Monitor metrics (token usage, generation time, quality)

2. **Week 3-4: Alpha rollout (5%)**
   - Enable v2 for 5% of organizations (by hash)
   - Compare metrics: v1 vs v2
   - Monitor error rates and regeneration requests

3. **Week 5-6: Beta rollout (25%)**
   - If metrics look good, expand to 25%
   - Collect user feedback via surveys
   - Tune reasoning budget and tool behavior

4. **Week 7+: Gradual increase**
   - Increase by 25% every 2 weeks if metrics remain positive
   - Reach 100% rollout after validation

##### 5.2 Success Criteria

V2 must match or exceed v1 on:
- **Quality**: Regeneration rate <= v1
- **Performance**: p95 latency <= v1 + 20%
- **Reliability**: Error rate <= v1
- **Cost**: Token cost per generation <= v1 + 30% (acceptable given quality improvement)

##### 5.3 Rollback Plan

```typescript
// Feature flag configuration
interface FeatureFlags {
  v2Enabled: boolean;  // Master kill switch
  v2RolloutPercentage: number;  // 0-100
  forceV1: boolean;  // Override for specific orgs
  forceV2: boolean;  // Override for specific orgs
  v2FallbackOnError: boolean;  // Auto-fallback to v1 if v2 errors
}

// Automatic fallback on v2 errors
async function generateTemplateWithFallback(options: GenerateOptions) {
  const version = getTemplateGenerationVersion(options.organizationId, flags);
  
  if (version === 'v1') {
    return generateV1(options);
  }
  
  try {
    return await generateV2(options);
  } catch (error) {
    logger.error('V2 generation failed, falling back to v1', { error });
    
    if (flags.v2FallbackOnError) {
      return generateV1(options);
    }
    
    throw error;
  }
}
```

##### 5.4 Quality Gates

Before making v2 the default:
- ✅ 2+ weeks of stable metrics at 100% rollout
- ✅ Positive user feedback (NPS or equivalent)
- ✅ Team consensus on quality improvement
- ✅ Cost analysis shows acceptable ROI

##### 5.5 Long-term Plan

- **Keep v1 code for at least 2 release cycles** post-v2 GA (as fallback)
- **Archive v1** only after 3+ months of stable v2 usage
- **Document lessons learned** for future AI feature development

---

### 4. Reasoning Strategy

#### 4.1 Model Support

- **Enable only for models that support it** (e.g., `anthropic/claude-3.5-sonnet` via OpenRouter)
- Check model capabilities before enabling reasoning
- Log warnings if reasoning requested but not supported

#### 4.2 Configuration

```typescript
// Server environment variables
AI_REASONING_ENABLED=true  // Global gate
AI_REASONING_DEFAULT_BUDGET_TOKENS=256
AI_REASONING_MODE=planning  // planning | validation | full
```

#### 4.3 Budget Allocation

- **Planning mode**: 128-256 tokens (before generation)
- **Validation mode**: 128 tokens (after generation)
- **Full mode**: 384-512 tokens (both phases)

Tune based on observed token usage and quality impact.

#### 4.4 Logging and Observability

```typescript
// Log reasoning usage
logger.info('AI generation with reasoning', {
  component: 'ai-v2',
  action: 'streamTemplateV2',
  reasoning: {
    enabled: true,
    budgetTokens: 256,
    actualTokens: usage.reasoningTokens,  // If provider exposes
    mode: 'full',
  },
});
```

**Important**: Do not log full reasoning content in production (PII/privacy concern). Only log metadata.

---

### 5. Tool-Calling Considerations

#### 5.1 Safety & Reliability

- **Idempotency**: All tools must be safe to call multiple times
- **Validation**: Use Zod to validate tool inputs strictly
- **Error handling**: Return structured errors, not exceptions
- **Fallbacks**: Provide degraded-but-safe behavior on tool failures

Example:
```typescript
execute: async ({ organizationId }) => {
  try {
    const brand = await getBrandKitByOrgId(organizationId);
    if (!brand) {
      return {
        success: false,
        message: 'Brand not found. Using professional defaults.',
        defaults: DEFAULT_BRAND_STYLES,
      };
    }
    return { success: true, brand };
  } catch (error) {
    logger.error('Brand tool error', { error });
    return {
      success: false,
      message: 'Error fetching brand. Using defaults.',
      defaults: DEFAULT_BRAND_STYLES,
    };
  }
}
```

#### 5.2 Performance

- **Efficient queries**: Use DB indexes, limit result sets
- **Caching**: Cache brand settings per request
- **Timeouts**: Set reasonable timeouts (5s max per tool)
- **Parallel execution**: When possible, AI SDK executes tools in parallel

#### 5.3 Security

- **Authorization**: Verify user has access to organization/template
- **Rate limiting**: Apply rate limits per tool per organization
- **Input sanitization**: Validate all tool inputs with Zod
- **Audit logging**: Log all tool executions with context

```typescript
// Tool execution middleware
async function executeToolWithAuth(
  toolName: string,
  params: unknown,
  context: { userId: string; organizationId: string }
) {
  // Check authorization
  if (!await hasAccess(context.userId, context.organizationId)) {
    throw new Error('Unauthorized tool access');
  }
  
  // Rate limit
  if (await isRateLimited(context.organizationId, toolName)) {
    throw new Error('Tool rate limit exceeded');
  }
  
  // Execute
  const startTime = Date.now();
  const result = await tools[toolName].execute(params);
  
  // Audit log
  logger.info('Tool executed', {
    tool: toolName,
    userId: context.userId,
    organizationId: context.organizationId,
    latencyMs: Date.now() - startTime,
    success: result.success,
  });
  
  return result;
}
```

#### 5.4 Telemetry

Track which tools are actually useful:
- Call frequency per tool
- Latency percentiles
- Success/error rates
- Impact on generation quality (A/B test with/without specific tools)

Use this data to:
- Remove unused tools (reduce prompt size)
- Optimize slow tools
- Improve tool descriptions for better model understanding

---

### 6. Documentation Updates

#### 6.1 Update `dev-docs/ai-stream.md`

Add Mocah-specific section at the end:

```markdown
---

## Mocah-Specific Usage

### Overview

Mocah uses AI SDK for generating React Email templates with:
- **V1**: Structured output via `streamObject` (type-safe, no tools)
- **V2**: Structured output via `streamText` + `experimental_output` (type-safe with tool calling)
- Multi-modal input (text + reference images)
- Tool calling (brand settings, template context, validation) - V2 only
- Optional reasoning for complex generation tasks

### Template Generation

#### V1: Simple Structured Streaming (No Tools)

```typescript
import { aiClient } from '@mocah/api/lib/ai';
import { reactEmailGenerationSchema } from '@mocah/api/lib/prompts';

// V1 uses streamObject - no tool calling, but fast and simple
const stream = aiClient.streamStructured(
  reactEmailGenerationSchema,
  'Create a welcome email with a CTA button',
  TEMPLATE_GENERATION_MODEL,
  {
    schemaName: 'ReactEmailTemplate',
    imageUrls: ['https://example.com/ref.png'],
  }
);

// Access partial results as they stream
for await (const partial of stream.partialObjectStream) {
  console.log(partial);
}

// Final result
const finalObject = await stream.object;
```

#### V2: Enhanced with Tools and Reasoning

```typescript
import { streamTemplateV2 } from '@mocah/api/lib/ai-v2';
import { reactEmailGenerationSchema } from '@mocah/api/lib/prompts';

// V2 uses streamText with experimental_output
// Supports tool calling + structured output
const stream = await streamTemplateV2(
  reactEmailGenerationSchema,
  {
    prompt: 'Create a welcome email with our brand colors',
    organizationId: 'org_123',
    imageUrls: ['https://example.com/ref.png'],
    enableReasoning: true,
    enableTools: true,
  }
);

// Stream processing
for await (const chunk of stream.fullStream) {
  // Handle text chunks and tool calls
}

// Access structured output after completion
const result = await stream.experimental_output;
console.log(result); // Typed as reactEmailGenerationSchema
```

**Key Difference**:
- V1 (`streamObject`): Fast, simple, no tool calling
- V2 (`streamText` + `experimental_output`): Tool calling enabled, structured output maintained

### Frontend Integration

```typescript
import { useStreamTemplate } from '@/hooks/use-stream-template';

function EmailGenerator() {
  const { partialTemplate, generate, isGenerating, error } = useStreamTemplate({
    organizationId: org.id,
    mode: 'v2',  // Enable v2 features
    enableReasoning: true,
    onComplete: (template) => {
      console.log('Generated:', template);
    },
  });
  
  const handleGenerate = async () => {
    await generate('Create a promotional email for our summer sale');
  };
  
  return (
    <div>
      <button onClick={handleGenerate} disabled={isGenerating}>
        Generate
      </button>
      {partialTemplate && (
        <div>
          <h3>{partialTemplate.subject}</h3>
          <pre>{partialTemplate.reactEmailCode}</pre>
        </div>
      )}
    </div>
  );
}
```

### Tool Implementation

See Phase 2 for detailed tool implementations. Key tools:

- **getBrandSettings**: Fetches organization brand colors, fonts, logo, tone
- **getTemplateContext**: Provides existing template context for regenerations
- **validateEmailCode**: Validates React Email code compliance

### Multi-Modal Input

Images are automatically converted to `UserContent` format:

```typescript
const userContent: UserContent = [
  { type: 'text', text: prompt },
  { type: 'image', image: 'https://example.com/reference.png' },
  { type: 'image', image: 'https://example.com/layout.png' },
];
```

### Reasoning Configuration

```typescript
interface ReasoningConfig {
  enabled: boolean;
  budgetTokens?: number;  // Default: 256
  mode?: 'planning' | 'validation' | 'full';
}
```

Modes:
- **planning**: Model reasons about structure before generating
- **validation**: Model reasons about correctness after generating
- **full**: Both planning and validation phases
```

#### 6.2 Create Internal Wiki Page

Document for team:
- How to enable v2 for testing
- How to interpret telemetry dashboards
- Troubleshooting common issues
- How to add new tools

---

### 7. Summary

#### What We're Building

- ✅ **V1 preserved**: Existing `streamObject` + `useObject` flow untouched (no tool calling)
- ✅ **V2 enhanced**: `streamText` + `experimental_output` with tools + reasoning
- ✅ **Structured output**: Maintain Zod validation guarantees via `experimental_output`
- ✅ **Multi-modal**: Text + images preserved
- ✅ **Tools**: Brand settings, template context, code validation (V2 only)
- ✅ **Reasoning**: Optional, configurable, with budget controls (both V1 and V2)
- ✅ **Observability**: Comprehensive metrics for v1 vs v2 comparison
- ✅ **Rollout**: Gradual, with automatic fallback and kill switches

**Core Architectural Constraint**: 
- `streamObject` does NOT support tools (AI SDK limitation)
- Must use `streamText` + `experimental_output` for V2 to enable tool calling
- This is not a preference—it's the only way to get tools + structured output

#### Migration Timeline

- **Week 1-2**: Phase 0-1 (infrastructure, flags, enhanced aiClient)
- **Week 3-4**: Phase 2 (tool implementations)
- **Week 5**: Phase 2.5 (observability setup)
- **Week 6-7**: Phase 3 (v2 implementation)
- **Week 8**: Phase 4 (frontend integration)
- **Week 9-16**: Phase 5 (gradual rollout, monitoring)
- **Week 17+**: Stabilization, tuning, documentation

#### Success Metrics

V2 should deliver:
- 🎯 **Better quality**: Fewer regenerations, fewer immediate edits
- 🎯 **Brand consistency**: Better adherence to organization styles
- 🎯 **Smart regenerations**: Preserves desired elements, changes requested parts
- 🎯 **Acceptable performance**: <20% latency increase
- 🎯 **Acceptable cost**: <30% token cost increase

#### Key Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| V2 quality worse than v1 | A/B testing, gradual rollout with metrics |
| Tool latency impacts UX | Caching, parallel execution, timeouts |
| Higher token costs | Budget controls, cost monitoring, ROI analysis |
| Complex rollback | Feature flags, automatic fallback, v1 preservation |
| Model doesn't use tools well | Iterate on tool descriptions, prompt engineering |

---

### Appendix: Alternative Approaches Considered

#### A. Enhanced `streamObject` with Pre/Post Tool Calls

**Approach**: Use `streamObject` for structured output, call tools separately before/after.

**Pros**:
- Keeps using existing `streamObject` infrastructure
- Structured output guarantees built-in

**Cons**:
- ❌ **`streamObject` does NOT support tools** (confirmed by AI SDK docs)
- Would require orchestrating separate tool calls outside the model's control
- Model can't decide when/which tools to call based on context
- More complex manual orchestration

**Decision**: **Impossible**. `streamObject` fundamentally doesn't support tool calling.

#### B. Pure `streamText` with XML Tags

**Approach**: Use `streamText`, ask model to emit `<Template>`, `<Subject>`, `<PreviewText>` tags, parse on server.

**Pros**:
- Tool calling works natively
- Reasoning integrates naturally

**Cons**:
- Loses structured output guarantees
- Need robust XML/tag parsing
- Harder to validate partial streams
- Type safety compromised
- More error-prone

**Decision**: Rejected. `experimental_output` provides structured output without manual parsing.

#### C. `streamText` with `experimental_output` (CHOSEN)

**Approach**: Use `streamText` with `experimental_output` for structured output + tool calling.

**Pros**:
- ✅ Tool calling support (required for our use case)
- ✅ Structured output via `experimental_output` + Zod schema
- ✅ Reasoning support
- ✅ Type safety maintained
- ✅ No manual parsing needed

**Cons**:
- Uses experimental API (may change)
- Adds output generation as an execution step (adjust `maxSteps`)
- Different streaming semantics vs `streamObject`
- Need to test frontend compatibility

**Decision**: **CHOSEN**. Only viable approach that satisfies all requirements (tools + structured output).

#### D. Separate Reasoning Step + Generation Step

**Approach**: Call `generateText` first to reason, then `streamObject` to generate.

**Pros**:
- Clear separation of concerns
- Can save reasoning for audit/debugging

**Cons**:
- Two round-trips to LLM (slower)
- More complex orchestration
- Higher token costs
- Still doesn't solve tool calling (streamObject limitation)

**Decision**: Rejected. Doesn't address tool calling limitation, and single-pass is faster.

#### E. Custom Streaming Parser

**Approach**: Build custom SSE parser that handles both tools and structured output.

**Pros**:
- Maximum control
- Could optimize for our exact use case

**Cons**:
- High maintenance burden
- Reinventing AI SDK functionality
- Loses ecosystem benefits
- Would take weeks to build and test

**Decision**: Rejected. AI SDK provides this functionality out of the box via `experimental_output`.

---

### Key Finding: Why We Must Use `streamText` with `experimental_output`

**The Critical Constraint**: AI SDK's `streamObject` and `generateObject` **do not support tool calling**. This is documented in the AI SDK troubleshooting section.

**Our Requirements**:
1. ✅ Structured output (Zod validation)
2. ✅ Tool calling (brand settings, template context, validation)
3. ✅ Reasoning support
4. ✅ Multi-modal input (text + images)

**The Only Solution**: `streamText` with `experimental_output` is the only AI SDK API that satisfies all four requirements.

**Trade-off**: We accept using an experimental API because:
- It's the only way to get tools + structured output
- AI SDK is stable and widely used
- Experimental APIs in AI SDK typically graduate to stable
- We can isolate this behind our `aiClient` abstraction
- Benefits (tool calling) outweigh the risk
