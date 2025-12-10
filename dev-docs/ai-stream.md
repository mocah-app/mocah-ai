

# `streamText()`

Streams text generations from a language model.

You can use the streamText function for interactive use cases such as chat bots and other real-time applications. You can also generate UI components with tools.

```ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

const { textStream } = streamText({
  model: openai('gpt-4o'),
  prompt: 'Invent a new holiday and describe its traditions.',
});

for await (const textPart of textStream) {
  process.stdout.write(textPart);
}
```

To see `streamText` in action, check out [these examples](#examples).

## Import

<Snippet text={`import { streamText } from "ai"`} prompt={false} />

## API Signature

### Parameters

<PropertiesTable
  content={[
    {
      name: 'model',
      type: 'LanguageModel',
      description: "The language model to use. Example: openai('gpt-4.1')",
    },
    {
      name: 'system',
      type: 'string',
      description:
        'The system prompt to use that specifies the behavior of the model.',
    },
    {
      name: 'prompt',
      type: 'string | Array<SystemModelMessage | UserModelMessage | AssistantModelMessage | ToolModelMessage>',
      description: 'The input prompt to generate the text from.',
    },
    {
      name: 'messages',
      type: 'Array<SystemModelMessage | UserModelMessage | AssistantModelMessage | ToolModelMessage>',
      description:
        'A list of messages that represent a conversation. Automatically converts UI messages from the useChat hook.',
      properties: [
        {
          type: 'SystemModelMessage',
          parameters: [
            {
              name: 'role',
              type: "'system'",
              description: 'The role for the system message.',
            },
            {
              name: 'content',
              type: 'string',
              description: 'The content of the message.',
            },
          ],
        },
        {
          type: 'UserModelMessage',
          parameters: [
            {
              name: 'role',
              type: "'user'",
              description: 'The role for the user message.',
            },
            {
              name: 'content',
              type: 'string | Array<TextPart | ImagePart | FilePart>',
              description: 'The content of the message.',
              properties: [
                {
                  type: 'TextPart',
                  parameters: [
                    {
                      name: 'type',
                      type: "'text'",
                      description: 'The type of the message part.',
                    },
                    {
                      name: 'text',
                      type: 'string',
                      description: 'The text content of the message part.',
                    },
                  ],
                },
                {
                  type: 'ImagePart',
                  parameters: [
                    {
                      name: 'type',
                      type: "'image'",
                      description: 'The type of the message part.',
                    },
                    {
                      name: 'image',
                      type: 'string | Uint8Array | Buffer | ArrayBuffer | URL',
                      description:
                        'The image content of the message part. String are either base64 encoded content, base64 data URLs, or http(s) URLs.',
                    },
                    {
                      name: 'mediaType',
                      type: 'string',
                      isOptional: true,
                      description: 'The IANA media type of the image.',
                    },
                  ],
                },
                {
                  type: 'FilePart',
                  parameters: [
                    {
                      name: 'type',
                      type: "'file'",
                      description: 'The type of the message part.',
                    },
                    {
                      name: 'data',
                      type: 'string | Uint8Array | Buffer | ArrayBuffer | URL',
                      description:
                        'The file content of the message part. String are either base64 encoded content, base64 data URLs, or http(s) URLs.',
                    },
                    {
                      name: 'mediaType',
                      type: 'string',
                      description: 'The IANA media type of the file.',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'AssistantModelMessage',
          parameters: [
            {
              name: 'role',
              type: "'assistant'",
              description: 'The role for the assistant message.',
            },
            {
              name: 'content',
              type: 'string | Array<TextPart | FilePart | ReasoningPart | ToolCallPart>',
              description: 'The content of the message.',
              properties: [
                {
                  type: 'TextPart',
                  parameters: [
                    {
                      name: 'type',
                      type: "'text'",
                      description: 'The type of the message part.',
                    },
                    {
                      name: 'text',
                      type: 'string',
                      description: 'The text content of the message part.',
                    },
                  ],
                },
                {
                  type: 'ReasoningPart',
                  parameters: [
                    {
                      name: 'type',
                      type: "'reasoning'",
                      description: 'The type of the reasoning part.',
                    },
                    {
                      name: 'text',
                      type: 'string',
                      description: 'The reasoning text.',
                    },
                  ],
                },
                {
                  type: 'FilePart',
                  parameters: [
                    {
                      name: 'type',
                      type: "'file'",
                      description: 'The type of the message part.',
                    },
                    {
                      name: 'data',
                      type: 'string | Uint8Array | Buffer | ArrayBuffer | URL',
                      description:
                        'The file content of the message part. String are either base64 encoded content, base64 data URLs, or http(s) URLs.',
                    },
                    {
                      name: 'mediaType',
                      type: 'string',
                      description: 'The IANA media type of the file.',
                    },
                    {
                      name: 'filename',
                      type: 'string',
                      description: 'The name of the file.',
                      isOptional: true,
                    },
                  ],
                },
                {
                  type: 'ToolCallPart',
                  parameters: [
                    {
                      name: 'type',
                      type: "'tool-call'",
                      description: 'The type of the message part.',
                    },
                    {
                      name: 'toolCallId',
                      type: 'string',
                      description: 'The id of the tool call.',
                    },
                    {
                      name: 'toolName',
                      type: 'string',
                      description:
                        'The name of the tool, which typically would be the name of the function.',
                    },
                    {
                      name: 'input',
                      type: 'object based on zod schema',
                      description:
                        'Parameters generated by the model to be used by the tool.',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'ToolModelMessage',
          parameters: [
            {
              name: 'role',
              type: "'tool'",
              description: 'The role for the assistant message.',
            },
            {
              name: 'content',
              type: 'Array<ToolResultPart>',
              description: 'The content of the message.',
              properties: [
                {
                  type: 'ToolResultPart',
                  parameters: [
                    {
                      name: 'type',
                      type: "'tool-result'",
                      description: 'The type of the message part.',
                    },
                    {
                      name: 'toolCallId',
                      type: 'string',
                      description:
                        'The id of the tool call the result corresponds to.',
                    },
                    {
                      name: 'toolName',
                      type: 'string',
                      description:
                        'The name of the tool the result corresponds to.',
                    },
                    {
                      name: 'result',
                      type: 'unknown',
                      description:
                        'The result returned by the tool after execution.',
                    },
                    {
                      name: 'isError',
                      type: 'boolean',
                      isOptional: true,
                      description:
                        'Whether the result is an error or an error message.',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'tools',
      type: 'ToolSet',
      description:
        'Tools that are accessible to and can be called by the model. The model needs to support calling tools.',
      properties: [
        {
          type: 'Tool',
          parameters: [
            {
              name: 'description',
              isOptional: true,
              type: 'string',
              description:
                'Information about the purpose of the tool including details on how and when it can be used by the model.',
            },
            {
              name: 'inputSchema',
              type: 'Zod Schema | JSON Schema',
              description:
                'The schema of the input that the tool expects. The language model will use this to generate the input. It is also used to validate the output of the language model. Use descriptions to make the input understandable for the language model. You can either pass in a Zod schema or a JSON schema (using the `jsonSchema` function).',
            },
            {
              name: 'execute',
              isOptional: true,
              type: 'async (parameters: T, options: ToolExecutionOptions) => RESULT',
              description:
                'An async function that is called with the arguments from the tool call and produces a result. If not provided, the tool will not be executed automatically.',
              properties: [
                {
                  type: 'ToolExecutionOptions',
                  parameters: [
                    {
                      name: 'toolCallId',
                      type: 'string',
                      description:
                        'The ID of the tool call. You can use it e.g. when sending tool-call related information with stream data.',
                    },
                    {
                      name: 'messages',
                      type: 'ModelMessage[]',
                      description:
                        'Messages that were sent to the language model to initiate the response that contained the tool call. The messages do not include the system prompt nor the assistant response that contained the tool call.',
                    },
                    {
                      name: 'abortSignal',
                      type: 'AbortSignal',
                      description:
                        'An optional abort signal that indicates that the overall operation should be aborted.',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'toolChoice',
      isOptional: true,
      type: '"auto" | "none" | "required" | { "type": "tool", "toolName": string }',
      description:
        'The tool choice setting. It specifies how tools are selected for execution. The default is "auto". "none" disables tool execution. "required" requires tools to be executed. { "type": "tool", "toolName": string } specifies a specific tool to execute.',
    },
    {
      name: 'maxOutputTokens',
      type: 'number',
      isOptional: true,
      description: 'Maximum number of tokens to generate.',
    },
    {
      name: 'temperature',
      type: 'number',
      isOptional: true,
      description:
        'Temperature setting. The value is passed through to the provider. The range depends on the provider and model. It is recommended to set either `temperature` or `topP`, but not both.',
    },
    {
      name: 'topP',
      type: 'number',
      isOptional: true,
      description:
        'Nucleus sampling. The value is passed through to the provider. The range depends on the provider and model. It is recommended to set either `temperature` or `topP`, but not both.',
    },
    {
      name: 'topK',
      type: 'number',
      isOptional: true,
      description:
        'Only sample from the top K options for each subsequent token. Used to remove "long tail" low probability responses. Recommended for advanced use cases only. You usually only need to use temperature.',
    },
    {
      name: 'presencePenalty',
      type: 'number',
      isOptional: true,
      description:
        'Presence penalty setting. It affects the likelihood of the model to repeat information that is already in the prompt. The value is passed through to the provider. The range depends on the provider and model.',
    },
    {
      name: 'frequencyPenalty',
      type: 'number',
      isOptional: true,
      description:
        'Frequency penalty setting. It affects the likelihood of the model to repeatedly use the same words or phrases. The value is passed through to the provider. The range depends on the provider and model.',
    },
    {
      name: 'stopSequences',
      type: 'string[]',
      isOptional: true,
      description:
        'Sequences that will stop the generation of the text. If the model generates any of these sequences, it will stop generating further text.',
    },
    {
      name: 'seed',
      type: 'number',
      isOptional: true,
      description:
        'The seed (integer) to use for random sampling. If set and supported by the model, calls will generate deterministic results.',
    },
    {
      name: 'maxRetries',
      type: 'number',
      isOptional: true,
      description:
        'Maximum number of retries. Set to 0 to disable retries. Default: 2.',
    },
    {
      name: 'abortSignal',
      type: 'AbortSignal',
      isOptional: true,
      description:
        'An optional abort signal that can be used to cancel the call.',
    },
    {
      name: 'headers',
      type: 'Record<string, string>',
      isOptional: true,
      description:
        'Additional HTTP headers to be sent with the request. Only applicable for HTTP-based providers.',
    },
    {
      name: 'experimental_generateMessageId',
      type: '() => string',
      isOptional: true,
      description:
        'Function used to generate a unique ID for each message. This is an experimental feature.',
    },
    {
      name: 'experimental_telemetry',
      type: 'TelemetrySettings',
      isOptional: true,
      description: 'Telemetry configuration. Experimental feature.',
      properties: [
        {
          type: 'TelemetrySettings',
          parameters: [
            {
              name: 'isEnabled',
              type: 'boolean',
              isOptional: true,
              description:
                'Enable or disable telemetry. Disabled by default while experimental.',
            },
            {
              name: 'recordInputs',
              type: 'boolean',
              isOptional: true,
              description:
                'Enable or disable input recording. Enabled by default.',
            },
            {
              name: 'recordOutputs',
              type: 'boolean',
              isOptional: true,
              description:
                'Enable or disable output recording. Enabled by default.',
            },
            {
              name: 'functionId',
              type: 'string',
              isOptional: true,
              description:
                'Identifier for this function. Used to group telemetry data by function.',
            },
            {
              name: 'metadata',
              isOptional: true,
              type: 'Record<string, string | number | boolean | Array<null | undefined | string> | Array<null | undefined | number> | Array<null | undefined | boolean>>',
              description:
                'Additional information to include in the telemetry data.',
            },
          ],
        },
      ],
    },
    {
      name: 'experimental_transform',
      type: 'StreamTextTransform | Array<StreamTextTransform>',
      isOptional: true,
      description:
        'Optional stream transformations. They are applied in the order they are provided. The stream transformations must maintain the stream structure for streamText to work correctly.',
      properties: [
        {
          type: 'StreamTextTransform',
          parameters: [
            {
              name: 'transform',
              type: '(options: TransformOptions) => TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>',
              description: 'A transformation that is applied to the stream.',
              properties: [
                {
                  type: 'TransformOptions',
                  parameters: [
                    {
                      name: 'stopStream',
                      type: '() => void',
                      description: 'A function that stops the stream.',
                    },
                    {
                      name: 'tools',
                      type: 'TOOLS',
                      description: 'The tools that are available.',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'includeRawChunks',
      type: 'boolean',
      isOptional: true,
      description:
        'Whether to include raw chunks from the provider in the stream. When enabled, you will receive raw chunks with type "raw" that contain the unprocessed data from the provider. This allows access to cutting-edge provider features not yet wrapped by the AI SDK. Defaults to false.',
    },
    {
      name: 'providerOptions',
      type: 'Record<string,Record<string,JSONValue>> | undefined',
      isOptional: true,
      description:
        'Provider-specific options. The outer key is the provider name. The inner values are the metadata. Details depend on the provider.',
    },
    {
      name: 'activeTools',
      type: 'Array<TOOLNAME> | undefined',
      isOptional: true,
      description:
        'The tools that are currently active. All tools are active by default.',
    },
    {
      name: 'stopWhen',
      type: 'StopCondition<TOOLS> | Array<StopCondition<TOOLS>>',
      isOptional: true,
      description:
        'Condition for stopping the generation when there are tool results in the last step. When the condition is an array, any of the conditions can be met to stop the generation. Default: stepCountIs(1).',
    },
    {
      name: 'prepareStep',
      type: '(options: PrepareStepOptions) => PrepareStepResult<TOOLS> | Promise<PrepareStepResult<TOOLS>>',
      isOptional: true,
      description:
        'Optional function that you can use to provide different settings for a step. You can modify the model, tool choices, active tools, system prompt, and input messages for each step.',
      properties: [
        {
          type: 'PrepareStepFunction<TOOLS>',
          parameters: [
            {
              name: 'options',
              type: 'object',
              description: 'The options for the step.',
              properties: [
                {
                  type: 'PrepareStepOptions',
                  parameters: [
                    {
                      name: 'steps',
                      type: 'Array<StepResult<TOOLS>>',
                      description: 'The steps that have been executed so far.',
                    },
                    {
                      name: 'stepNumber',
                      type: 'number',
                      description:
                        'The number of the step that is being executed.',
                    },
                    {
                      name: 'model',
                      type: 'LanguageModel',
                      description: 'The model that is being used.',
                    },
                    {
                      name: 'messages',
                      type: 'Array<ModelMessage>',
                      description:
                        'The messages that will be sent to the model for the current step.',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'PrepareStepResult<TOOLS>',
          description:
            'Return value that can modify settings for the current step.',
          parameters: [
            {
              name: 'model',
              type: 'LanguageModel',
              isOptional: true,
              description: 'Change the model for this step.',
            },
            {
              name: 'toolChoice',
              type: 'ToolChoice<TOOLS>',
              isOptional: true,
              description: 'Change the tool choice strategy for this step.',
            },
            {
              name: 'activeTools',
              type: 'Array<keyof TOOLS>',
              isOptional: true,
              description: 'Change which tools are active for this step.',
            },
            {
              name: 'system',
              type: 'string',
              isOptional: true,
              description: 'Change the system prompt for this step.',
            },
            {
              name: 'messages',
              type: 'Array<ModelMessage>',
              isOptional: true,
              description: 'Modify the input messages for this step.',
            },
          ],
        },
      ],
    },
    {
      name: 'experimental_context',
      type: 'unknown',
      isOptional: true,
      description:
        'Context that is passed into tool execution. Experimental (can break in patch releases).',
    },
    {
      name: 'experimental_download',
      type: '(requestedDownloads: Array<{ url: URL; isUrlSupportedByModel: boolean }>) => Promise<Array<null | { data: Uint8Array; mediaType?: string }>>',
      isOptional: true,
      description:
        'Custom download function to control how URLs are fetched when they appear in prompts. By default, files are downloaded if the model does not support the URL for the given media type. Experimental feature. Return null to pass the URL directly to the model (when supported), or return downloaded content with data and media type.',
    },
    {
      name: 'experimental_repairToolCall',
      type: '(options: ToolCallRepairOptions) => Promise<LanguageModelV2ToolCall | null>',
      isOptional: true,
      description:
        'A function that attempts to repair a tool call that failed to parse. Return either a repaired tool call or null if the tool call cannot be repaired.',
      properties: [
        {
          type: 'ToolCallRepairOptions',
          parameters: [
            {
              name: 'system',
              type: 'string | undefined',
              description: 'The system prompt.',
            },
            {
              name: 'messages',
              type: 'ModelMessage[]',
              description: 'The messages in the current generation step.',
            },
            {
              name: 'toolCall',
              type: 'LanguageModelV2ToolCall',
              description: 'The tool call that failed to parse.',
            },
            {
              name: 'tools',
              type: 'TOOLS',
              description: 'The tools that are available.',
            },
            {
              name: 'parameterSchema',
              type: '(options: { toolName: string }) => JSONSchema7',
              description:
                'A function that returns the JSON Schema for a tool.',
            },
            {
              name: 'error',
              type: 'NoSuchToolError | InvalidToolInputError',
              description:
                'The error that occurred while parsing the tool call.',
            },
          ],
        },
      ],
    },
    {
      name: 'onChunk',
      type: '(event: OnChunkResult) => Promise<void> |void',
      isOptional: true,
      description:
        'Callback that is called for each chunk of the stream. The stream processing will pause until the callback promise is resolved.',
      properties: [
        {
          type: 'OnChunkResult',
          parameters: [
            {
              name: 'chunk',
              type: 'TextStreamPart',
              description: 'The chunk of the stream.',
              properties: [
                {
                  type: 'TextStreamPart',
                  parameters: [
                    {
                      name: 'type',
                      type: "'text'",
                      description:
                        'The type to identify the object as text delta.',
                    },
                    {
                      name: 'text',
                      type: 'string',
                      description: 'The text delta.',
                    },
                  ],
                },
                {
                  type: 'TextStreamPart',
                  parameters: [
                    {
                      name: 'type',
                      type: "'reasoning'",
                      description:
                        'The type to identify the object as reasoning.',
                    },
                    {
                      name: 'text',
                      type: 'string',
                      description: 'The reasoning text delta.',
                    },
                  ],
                },
                {
                  type: 'TextStreamPart',
                  parameters: [
                    {
                      name: 'type',
                      type: "'source'",
                      description: 'The type to identify the object as source.',
                    },
                    {
                      name: 'source',
                      type: 'Source',
                      description: 'The source.',
                    },
                  ],
                },
                {
                  type: 'TextStreamPart',
                  parameters: [
                    {
                      name: 'type',
                      type: "'tool-call'",
                      description:
                        'The type to identify the object as tool call.',
                    },
                    {
                      name: 'toolCallId',
                      type: 'string',
                      description: 'The id of the tool call.',
                    },
                    {
                      name: 'toolName',
                      type: 'string',
                      description:
                        'The name of the tool, which typically would be the name of the function.',
                    },
                    {
                      name: 'input',
                      type: 'object based on zod schema',
                      description:
                        'Parameters generated by the model to be used by the tool.',
                    },
                  ],
                },
                {
                  type: 'TextStreamPart',
                  parameters: [
                    {
                      name: 'type',
                      type: "'tool-call-streaming-start'",
                      description:
                        'Indicates the start of a tool call streaming. Only available when streaming tool calls.',
                    },
                    {
                      name: 'toolCallId',
                      type: 'string',
                      description: 'The id of the tool call.',
                    },
                    {
                      name: 'toolName',
                      type: 'string',
                      description:
                        'The name of the tool, which typically would be the name of the function.',
                    },
                  ],
                },
                {
                  type: 'TextStreamPart',
                  parameters: [
                    {
                      name: 'type',
                      type: "'tool-call-delta'",
                      description:
                        'The type to identify the object as tool call delta. Only available when streaming tool calls.',
                    },
                    {
                      name: 'toolCallId',
                      type: 'string',
                      description: 'The id of the tool call.',
                    },
                    {
                      name: 'toolName',
                      type: 'string',
                      description:
                        'The name of the tool, which typically would be the name of the function.',
                    },
                    {
                      name: 'argsTextDelta',
                      type: 'string',
                      description: 'The text delta of the tool call arguments.',
                    },
                  ],
                },
                {
                  type: 'TextStreamPart',
                  description: 'The result of a tool call execution.',
                  parameters: [
                    {
                      name: 'type',
                      type: "'tool-result'",
                      description:
                        'The type to identify the object as tool result.',
                    },
                    {
                      name: 'toolCallId',
                      type: 'string',
                      description: 'The id of the tool call.',
                    },
                    {
                      name: 'toolName',
                      type: 'string',
                      description:
                        'The name of the tool, which typically would be the name of the function.',
                    },
                    {
                      name: 'input',
                      type: 'object based on zod schema',
                      description:
                        'Parameters generated by the model to be used by the tool.',
                    },
                    {
                      name: 'output',
                      type: 'any',
                      description:
                        'The result returned by the tool after execution has completed.',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'onError',
      type: '(event: OnErrorResult) => Promise<void> |void',
      isOptional: true,
      description:
        'Callback that is called when an error occurs during streaming. You can use it to log errors.',
      properties: [
        {
          type: 'OnErrorResult',
          parameters: [
            {
              name: 'error',
              type: 'unknown',
              description: 'The error that occurred.',
            },
          ],
        },
      ],
    },
    {
      name: 'experimental_output',
      type: 'Output',
      isOptional: true,
      description: 'Experimental setting for generating structured outputs.',
      properties: [
        {
          type: 'Output',
          parameters: [
            {
              name: 'Output.text()',
              type: 'Output',
              description: 'Forward text output.',
            },
            {
              name: 'Output.object()',
              type: 'Output',
              description: 'Generate a JSON object of type OBJECT.',
              properties: [
                {
                  type: 'Options',
                  parameters: [
                    {
                      name: 'schema',
                      type: 'Schema<OBJECT>',
                      description: 'The schema of the JSON object to generate.',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'onStepFinish',
      type: '(result: onStepFinishResult) => Promise<void> | void',
      isOptional: true,
      description: 'Callback that is called when a step is finished.',
      properties: [
        {
          type: 'onStepFinishResult',
          parameters: [
            {
              name: 'stepType',
              type: '"initial" | "continue" | "tool-result"',
              description:
                'The type of step. The first step is always an "initial" step, and subsequent steps are either "continue" steps or "tool-result" steps.',
            },
            {
              name: 'finishReason',
              type: '"stop" | "length" | "content-filter" | "tool-calls" | "error" | "other" | "unknown"',
              description:
                'The reason the model finished generating the text for the step.',
            },
            {
              name: 'usage',
              type: 'LanguageModelUsage',
              description: 'The token usage of the step.',
              properties: [
                {
                  type: 'LanguageModelUsage',
                  parameters: [
                    {
                      name: 'inputTokens',
                      type: 'number | undefined',
                      description: 'The number of input (prompt) tokens used.',
                    },
                    {
                      name: 'outputTokens',
                      type: 'number | undefined',
                      description: 'The number of output (completion) tokens used.',
                    },
                    {
                      name: 'totalTokens',
                      type: 'number | undefined',
                      description:
                        'The total number of tokens as reported by the provider. This number might be different from the sum of inputTokens and outputTokens and e.g. include reasoning tokens or other overhead.',
                    },
                    {
                      name: 'reasoningTokens',
                      type: 'number | undefined',
                      isOptional: true,
                      description: 'The number of reasoning tokens used.',
                    },
                    {
                      name: 'cachedInputTokens',
                      type: 'number | undefined',
                      isOptional: true,
                      description: 'The number of cached input tokens.',
                    },
                  ],
                },
              ],
            },
            {
              name: 'text',
              type: 'string',
              description: 'The full text that has been generated.',
            },
            {
              name: 'reasoning',
              type: 'string | undefined',
              description:
                'The reasoning text of the model (only available for some models).',
            },
            {
              name: 'sources',
              type: 'Array<Source>',
              description:
                'Sources that have been used as input to generate the response. For multi-step generation, the sources are accumulated from all steps.',
              properties: [
                {
                  type: 'Source',
                  parameters: [
                    {
                      name: 'sourceType',
                      type: "'url'",
                      description:
                        'A URL source. This is return by web search RAG models.',
                    },
                    {
                      name: 'id',
                      type: 'string',
                      description: 'The ID of the source.',
                    },
                    {
                      name: 'url',
                      type: 'string',
                      description: 'The URL of the source.',
                    },
                    {
                      name: 'title',
                      type: 'string',
                      isOptional: true,
                      description: 'The title of the source.',
                    },
                    {
                      name: 'providerMetadata',
                      type: 'SharedV2ProviderMetadata',
                      isOptional: true,
                      description:
                        'Additional provider metadata for the source.',
                    },
                  ],
                },
              ],
            },
            {
              name: 'files',
              type: 'Array<GeneratedFile>',
              description: 'All files that were generated in this step.',
              properties: [
                {
                  type: 'GeneratedFile',
                  parameters: [
                    {
                      name: 'base64',
                      type: 'string',
                      description: 'File as a base64 encoded string.',
                    },
                    {
                      name: 'uint8Array',
                      type: 'Uint8Array',
                      description: 'File as a Uint8Array.',
                    },
                    {
                      name: 'mediaType',
                      type: 'string',
                      description: 'The IANA media type of the file.',
                    },
                  ],
                },
              ],
            },
            {
              name: 'toolCalls',
              type: 'ToolCall[]',
              description: 'The tool calls that have been executed.',
            },
            {
              name: 'toolResults',
              type: 'ToolResult[]',
              description: 'The tool results that have been generated.',
            },
            {
              name: 'warnings',
              type: 'Warning[] | undefined',
              description:
                'Warnings from the model provider (e.g. unsupported settings).',
            },
            {
              name: 'response',
              type: 'Response',
              isOptional: true,
              description: 'Response metadata.',
              properties: [
                {
                  type: 'Response',
                  parameters: [
                    {
                      name: 'id',
                      type: 'string',
                      description:
                        'The response identifier. The AI SDK uses the ID from the provider response when available, and generates an ID otherwise.',
                    },
                    {
                      name: 'model',
                      type: 'string',
                      description:
                        'The model that was used to generate the response. The AI SDK uses the response model from the provider response when available, and the model from the function call otherwise.',
                    },
                    {
                      name: 'timestamp',
                      type: 'Date',
                      description:
                        'The timestamp of the response. The AI SDK uses the response timestamp from the provider response when available, and creates a timestamp otherwise.',
                    },
                    {
                      name: 'headers',
                      isOptional: true,
                      type: 'Record<string, string>',
                      description: 'Optional response headers.',
                    },
                  ],
                },
              ],
            },
            {
              name: 'isContinued',
              type: 'boolean',
              description:
                'True when there will be a continuation step with a continuation text.',
            },
            {
              name: 'providerMetadata',
              type: 'Record<string,Record<string,JSONValue>> | undefined',
              isOptional: true,
              description:
                'Optional metadata from the provider. The outer key is the provider name. The inner values are the metadata. Details depend on the provider.',
            },
          ],
        },
      ],
    },
    {
      name: 'onFinish',
      type: '(result: OnFinishResult) => Promise<void> | void',
      isOptional: true,
      description:
        'Callback that is called when the LLM response and all request tool executions (for tools that have an `execute` function) are finished.',
      properties: [
        {
          type: 'OnFinishResult',
          parameters: [
            {
              name: 'finishReason',
              type: '"stop" | "length" | "content-filter" | "tool-calls" | "error" | "other" | "unknown"',
              description: 'The reason the model finished generating the text.',
            },
            {
              name: 'usage',
              type: 'LanguageModelUsage',
              description: 'The token usage of the generated text.',
              properties: [
                {
                  type: 'LanguageModelUsage',
                  parameters: [
                    {
                      name: 'inputTokens',
                      type: 'number | undefined',
                      description: 'The number of input (prompt) tokens used.',
                    },
                    {
                      name: 'outputTokens',
                      type: 'number | undefined',
                      description: 'The number of output (completion) tokens used.',
                    },
                    {
                      name: 'totalTokens',
                      type: 'number | undefined',
                      description:
                        'The total number of tokens as reported by the provider. This number might be different from the sum of inputTokens and outputTokens and e.g. include reasoning tokens or other overhead.',
                    },
                    {
                      name: 'reasoningTokens',
                      type: 'number | undefined',
                      isOptional: true,
                      description: 'The number of reasoning tokens used.',
                    },
                    {
                      name: 'cachedInputTokens',
                      type: 'number | undefined',
                      isOptional: true,
                      description: 'The number of cached input tokens.',
                    },
                  ],
                },
              ],
            },
            {
              name: 'providerMetadata',
              type: 'Record<string,Record<string,JSONValue>> | undefined',
              description:
                'Optional metadata from the provider. The outer key is the provider name. The inner values are the metadata. Details depend on the provider.',
            },
            {
              name: 'text',
              type: 'string',
              description: 'The full text that has been generated.',
            },
            {
              name: 'reasoning',
              type: 'string | undefined',
              description:
                'The reasoning text of the model (only available for some models).',
            },
            {
              name: 'reasoningDetails',
              type: 'Array<ReasoningDetail>',
              description:
                'The reasoning details of the model (only available for some models).',
              properties: [
                {
                  type: 'ReasoningDetail',
                  parameters: [
                    {
                      name: 'type',
                      type: "'text'",
                      description: 'The type of the reasoning detail.',
                    },
                    {
                      name: 'text',
                      type: 'string',
                      description: 'The text content (only for type "text").',
                    },
                    {
                      name: 'signature',
                      type: 'string',
                      isOptional: true,
                      description: 'Optional signature (only for type "text").',
                    },
                  ],
                },
                {
                  type: 'ReasoningDetail',
                  parameters: [
                    {
                      name: 'type',
                      type: "'redacted'",
                      description: 'The type of the reasoning detail.',
                    },
                    {
                      name: 'data',
                      type: 'string',
                      description:
                        'The redacted data content (only for type "redacted").',
                    },
                  ],
                },
              ],
            },
            {
              name: 'sources',
              type: 'Array<Source>',
              description:
                'Sources that have been used as input to generate the response. For multi-step generation, the sources are accumulated from all steps.',
              properties: [
                {
                  type: 'Source',
                  parameters: [
                    {
                      name: 'sourceType',
                      type: "'url'",
                      description:
                        'A URL source. This is return by web search RAG models.',
                    },
                    {
                      name: 'id',
                      type: 'string',
                      description: 'The ID of the source.',
                    },
                    {
                      name: 'url',
                      type: 'string',
                      description: 'The URL of the source.',
                    },
                    {
                      name: 'title',
                      type: 'string',
                      isOptional: true,
                      description: 'The title of the source.',
                    },
                    {
                      name: 'providerMetadata',
                      type: 'SharedV2ProviderMetadata',
                      isOptional: true,
                      description:
                        'Additional provider metadata for the source.',
                    },
                  ],
                },
              ],
            },
            {
              name: 'files',
              type: 'Array<GeneratedFile>',
              description: 'Files that were generated in the final step.',
              properties: [
                {
                  type: 'GeneratedFile',
                  parameters: [
                    {
                      name: 'base64',
                      type: 'string',
                      description: 'File as a base64 encoded string.',
                    },
                    {
                      name: 'uint8Array',
                      type: 'Uint8Array',
                      description: 'File as a Uint8Array.',
                    },
                    {
                      name: 'mediaType',
                      type: 'string',
                      description: 'The IANA media type of the file.',
                    },
                  ],
                },
              ],
            },
            {
              name: 'toolCalls',
              type: 'ToolCall[]',
              description: 'The tool calls that have been executed.',
            },
            {
              name: 'toolResults',
              type: 'ToolResult[]',
              description: 'The tool results that have been generated.',
            },
            {
              name: 'warnings',
              type: 'Warning[] | undefined',
              description:
                'Warnings from the model provider (e.g. unsupported settings).',
            },
            {
              name: 'response',
              type: 'Response',
              isOptional: true,
              description: 'Response metadata.',
              properties: [
                {
                  type: 'Response',
                  parameters: [
                    {
                      name: 'id',
                      type: 'string',
                      description:
                        'The response identifier. The AI SDK uses the ID from the provider response when available, and generates an ID otherwise.',
                    },
                    {
                      name: 'model',
                      type: 'string',
                      description:
                        'The model that was used to generate the response. The AI SDK uses the response model from the provider response when available, and the model from the function call otherwise.',
                    },
                    {
                      name: 'timestamp',
                      type: 'Date',
                      description:
                        'The timestamp of the response. The AI SDK uses the response timestamp from the provider response when available, and creates a timestamp otherwise.',
                    },
                    {
                      name: 'headers',
                      isOptional: true,
                      type: 'Record<string, string>',
                      description: 'Optional response headers.',
                    },
                    {
                      name: 'messages',
                      type: 'Array<ResponseMessage>',
                      description:
                        'The response messages that were generated during the call. It consists of an assistant message, potentially containing tool calls.  When there are tool results, there is an additional tool message with the tool results that are available. If there are tools that do not have execute functions, they are not included in the tool results and need to be added separately.',
                    },
                  ],
                },
              ],
            },
            {
              name: 'steps',
              type: 'Array<StepResult>',
              description:
                'Response information for every step. You can use this to get information about intermediate steps, such as the tool calls or the response headers.',
            },
          ],
        },
      ],
    },
    {
      name: 'onAbort',
      type: '(event: OnAbortResult) => Promise<void> | void',
      isOptional: true,
      description:
        'Callback that is called when a stream is aborted via AbortSignal. You can use it to perform cleanup operations.',
      properties: [
        {
          type: 'OnAbortResult',
          parameters: [
            {
              name: 'steps',
              type: 'Array<StepResult>',
              description: 'Details for all previously finished steps.',
            },
          ],
        },
      ],
    },

]}
/>

### Returns

<PropertiesTable
  content={[
    {
      name: 'content',
      type: 'Promise<Array<ContentPart<TOOLS>>>',
      description: 'The content that was generated in the last step. Automatically consumes the stream.',
    },
    {
      name: 'finishReason',
      type: "Promise<'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown'>",
      description:
        'The reason why the generation finished. Automatically consumes the stream.',
    },
    {
      name: 'usage',
      type: 'Promise<LanguageModelUsage>',
      description:
        'The token usage of the last step. Automatically consumes the stream.',
      properties: [
        {
          type: 'LanguageModelUsage',
          parameters: [
            {
              name: 'inputTokens',
              type: 'number | undefined',
              description: 'The number of input (prompt) tokens used.',
            },
            {
              name: 'outputTokens',
              type: 'number | undefined',
              description: 'The number of output (completion) tokens used.',
            },
            {
              name: 'totalTokens',
              type: 'number | undefined',
              description:
                'The total number of tokens as reported by the provider. This number might be different from the sum of inputTokens and outputTokens and e.g. include reasoning tokens or other overhead.',
            },
            {
              name: 'reasoningTokens',
              type: 'number | undefined',
              isOptional: true,
              description: 'The number of reasoning tokens used.',
            },
            {
              name: 'cachedInputTokens',
              type: 'number | undefined',
              isOptional: true,
              description: 'The number of cached input tokens.',
            },
          ],
        },
      ],
    },
    {
      name: 'totalUsage',
      type: 'Promise<LanguageModelUsage>',
      description: 'The total token usage of the generated response. When there are multiple steps, the usage is the sum of all step usages. Automatically consumes the stream.',
      properties: [
        {
          type: 'LanguageModelUsage',
          parameters: [
            {
              name: 'inputTokens',
              type: 'number | undefined',
              description: 'The number of input (prompt) tokens used.',
            },
            {
              name: 'outputTokens',
              type: 'number | undefined',
              description: 'The number of output (completion) tokens used.',
            },
            {
              name: 'totalTokens',
              type: 'number | undefined',
              description:
                'The total number of tokens as reported by the provider. This number might be different from the sum of inputTokens and outputTokens and e.g. include reasoning tokens or other overhead.',
            },
            {
              name: 'reasoningTokens',
              type: 'number | undefined',
              isOptional: true,
              description: 'The number of reasoning tokens used.',
            },
            {
              name: 'cachedInputTokens',
              type: 'number | undefined',
              isOptional: true,
              description: 'The number of cached input tokens.',
            },
          ],
        },
      ],
    },
    {
      name: 'providerMetadata',
      type: 'Promise<ProviderMetadata | undefined>',
      description:
        'Additional provider-specific metadata from the last step. Metadata is passed through from the provider to the AI SDK and enables provider-specific results that can be fully encapsulated in the provider.',
    },
    {
      name: 'text',
      type: 'Promise<string>',
      description:
        'The full text that has been generated. Automatically consumes the stream.',
    },
    {
      name: 'reasoning',
      type: 'Promise<Array<ReasoningOutput>>',
      description:
        'The full reasoning that the model has generated in the last step. Automatically consumes the stream.',
      properties: [
        {
          type: 'ReasoningOutput',
          parameters: [
            {
              name: 'type',
              type: "'reasoning'",
              description: 'The type of the message part.',
            },
            {
              name: 'text',
              type: 'string',
              description: 'The reasoning text.',
            },
            {
              name: 'providerMetadata',
              type: 'SharedV2ProviderMetadata',
              isOptional: true,
              description: 'Additional provider metadata for the source.',
            },
          ],
        },
      ],
    },
    {
      name: 'reasoningText',
      type: 'Promise<string | undefined>',
      description:
        'The reasoning text that the model has generated in the last step. Can be undefined if the model has only generated text. Automatically consumes the stream.',
    },
    {
      name: 'sources',
      type: 'Promise<Array<Source>>',
      description:
        'Sources that have been used as input to generate the response. For multi-step generation, the sources are accumulated from all steps. Automatically consumes the stream.',
      properties: [
        {
          type: 'Source',
          parameters: [
            {
              name: 'sourceType',
              type: "'url'",
              description:
                'A URL source. This is return by web search RAG models.',
            },
            {
              name: 'id',
              type: 'string',
              description: 'The ID of the source.',
            },
            {
              name: 'url',
              type: 'string',
              description: 'The URL of the source.',
            },
            {
              name: 'title',
              type: 'string',
              isOptional: true,
              description: 'The title of the source.',
            },
            {
              name: 'providerMetadata',
              type: 'SharedV2ProviderMetadata',
              isOptional: true,
              description: 'Additional provider metadata for the source.',
            },
          ],
        },
      ],
    },
    {
      name: 'files',
      type: 'Promise<Array<GeneratedFile>>',
      description:
        'Files that were generated in the final step. Automatically consumes the stream.',
      properties: [
        {
          type: 'GeneratedFile',
          parameters: [
            {
              name: 'base64',
              type: 'string',
              description: 'File as a base64 encoded string.',
            },
            {
              name: 'uint8Array',
              type: 'Uint8Array',
              description: 'File as a Uint8Array.',
            },
            {
              name: 'mediaType',
              type: 'string',
              description: 'The IANA media type of the file.',
            },
          ],
        },
      ],
    },
    {
      name: 'toolCalls',
      type: 'Promise<TypedToolCall<TOOLS>[]>',
      description:
        'The tool calls that have been executed. Automatically consumes the stream.',
    },
    {
      name: 'toolResults',
      type: 'Promise<TypedToolResult<TOOLS>[]>',
      description:
        'The tool results that have been generated. Resolved when the all tool executions are finished.',
    },
    {
      name: 'request',
      type: 'Promise<LanguageModelRequestMetadata>',
      description: 'Additional request information from the last step.',
      properties: [
        {
          type: 'LanguageModelRequestMetadata',
          parameters: [
            {
              name: 'body',
              type: 'string',
              description:
                'Raw request HTTP body that was sent to the provider API as a string (JSON should be stringified).',
            },
          ],
        },
      ],
    },
    {
      name: 'response',
      type: 'Promise<LanguageModelResponseMetadata & { messages: Array<ResponseMessage>; }>',
      description: 'Additional response information from the last step.',
      properties: [
        {
          type: 'LanguageModelResponseMetadata',
          parameters: [
            {
              name: 'id',
              type: 'string',
              description:
                'The response identifier. The AI SDK uses the ID from the provider response when available, and generates an ID otherwise.',
            },
            {
              name: 'model',
              type: 'string',
              description:
                'The model that was used to generate the response. The AI SDK uses the response model from the provider response when available, and the model from the function call otherwise.',
            },
            {
              name: 'timestamp',
              type: 'Date',
              description:
                'The timestamp of the response. The AI SDK uses the response timestamp from the provider response when available, and creates a timestamp otherwise.',
            },
            {
              name: 'headers',
              isOptional: true,
              type: 'Record<string, string>',
              description: 'Optional response headers.',
            },
            {
              name: 'messages',
              type: 'Array<ResponseMessage>',
              description:
                'The response messages that were generated during the call. It consists of an assistant message, potentially containing tool calls.  When there are tool results, there is an additional tool message with the tool results that are available. If there are tools that do not have execute functions, they are not included in the tool results and need to be added separately.',
            },
          ],
        },
      ],
    },
    {
      name: 'warnings',
      type: 'Promise<CallWarning[] | undefined>',
      description:
        'Warnings from the model provider (e.g. unsupported settings) for the first step.',
    },
    {
      name: 'steps',
      type: 'Promise<Array<StepResult>>',
      description:
        'Response information for every step. You can use this to get information about intermediate steps, such as the tool calls or the response headers.',
      properties: [
        {
          type: 'StepResult',
          parameters: [
            {
              name: 'stepType',
              type: '"initial" | "continue" | "tool-result"',
              description:
                'The type of step. The first step is always an "initial" step, and subsequent steps are either "continue" steps or "tool-result" steps.',
            },
            {
              name: 'text',
              type: 'string',
              description: 'The generated text by the model.',
            },
            {
              name: 'reasoning',
              type: 'string | undefined',
              description:
                'The reasoning text of the model (only available for some models).',
            },
            {
              name: 'sources',
              type: 'Array<Source>',
              description: 'Sources that have been used as input.',
              properties: [
                {
                  type: 'Source',
                  parameters: [
                    {
                      name: 'sourceType',
                      type: "'url'",
                      description:
                        'A URL source. This is return by web search RAG models.',
                    },
                    {
                      name: 'id',
                      type: 'string',
                      description: 'The ID of the source.',
                    },
                    {
                      name: 'url',
                      type: 'string',
                      description: 'The URL of the source.',
                    },
                    {
                      name: 'title',
                      type: 'string',
                      isOptional: true,
                      description: 'The title of the source.',
                    },
                    {
                      name: 'providerMetadata',
                      type: 'SharedV2ProviderMetadata',
                      isOptional: true,
                      description:
                        'Additional provider metadata for the source.',
                    },
                  ],
                },
              ],
            },
            {
              name: 'files',
              type: 'Array<GeneratedFile>',
              description: 'Files that were generated in this step.',
              properties: [
                {
                  type: 'GeneratedFile',
                  parameters: [
                    {
                      name: 'base64',
                      type: 'string',
                      description: 'File as a base64 encoded string.',
                    },
                    {
                      name: 'uint8Array',
                      type: 'Uint8Array',
                      description: 'File as a Uint8Array.',
                    },
                    {
                      name: 'mediaType',
                      type: 'string',
                      description: 'The IANA media type of the file.',
                    },
                  ],
                },
              ],
            },
            {
              name: 'toolCalls',
              type: 'array',
              description: 'A list of tool calls made by the model.',
            },
            {
              name: 'toolResults',
              type: 'array',
              description:
                'A list of tool results returned as responses to earlier tool calls.',
            },
            {
              name: 'finishReason',
              type: "'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown'",
              description: 'The reason the model finished generating the text.',
            },
            {
              name: 'usage',
              type: 'LanguageModelUsage',
              description: 'The token usage of the generated text.',
              properties: [
                {
                  type: 'LanguageModelUsage',
                  parameters: [
                    {
                      name: 'inputTokens',
                      type: 'number | undefined',
                      description: 'The number of input (prompt) tokens used.',
                    },
                    {
                      name: 'outputTokens',
                      type: 'number | undefined',
                      description: 'The number of output (completion) tokens used.',
                    },
                    {
                      name: 'totalTokens',
                      type: 'number | undefined',
                      description:
                        'The total number of tokens as reported by the provider. This number might be different from the sum of inputTokens and outputTokens and e.g. include reasoning tokens or other overhead.',
                    },
                    {
                      name: 'reasoningTokens',
                      type: 'number | undefined',
                      isOptional: true,
                      description: 'The number of reasoning tokens used.',
                    },
                    {
                      name: 'cachedInputTokens',
                      type: 'number | undefined',
                      isOptional: true,
                      description: 'The number of cached input tokens.',
                    },
                  ],
                },
              ],
            },
            {
              name: 'request',
              type: 'RequestMetadata',
              isOptional: true,
              description: 'Request metadata.',
              properties: [
                {
                  type: 'RequestMetadata',
                  parameters: [
                    {
                      name: 'body',
                      type: 'string',
                      description:
                        'Raw request HTTP body that was sent to the provider API as a string (JSON should be stringified).',
                    },
                  ],
                },
              ],
            },
            {
              name: 'response',
              type: 'ResponseMetadata',
              isOptional: true,
              description: 'Response metadata.',
              properties: [
                {
                  type: 'ResponseMetadata',
                  parameters: [
                    {
                      name: 'id',
                      type: 'string',
                      description:
                        'The response identifier. The AI SDK uses the ID from the provider response when available, and generates an ID otherwise.',
                    },
                    {
                      name: 'model',
                      type: 'string',
                      description:
                        'The model that was used to generate the response. The AI SDK uses the response model from the provider response when available, and the model from the function call otherwise.',
                    },
                    {
                      name: 'timestamp',
                      type: 'Date',
                      description:
                        'The timestamp of the response. The AI SDK uses the response timestamp from the provider response when available, and creates a timestamp otherwise.',
                    },
                    {
                      name: 'headers',
                      isOptional: true,
                      type: 'Record<string, string>',
                      description: 'Optional response headers.',
                    },
                    {
                      name: 'messages',
                      type: 'Array<ResponseMessage>',
                      description:
                        'The response messages that were generated during the call. It consists of an assistant message, potentially containing tool calls.  When there are tool results, there is an additional tool message with the tool results that are available. If there are tools that do not have execute functions, they are not included in the tool results and need to be added separately.',
                    },
                  ],
                },
              ],
            },
            {
              name: 'warnings',
              type: 'Warning[] | undefined',
              description:
                'Warnings from the model provider (e.g. unsupported settings).',
            },
            {
              name: 'isContinued',
              type: 'boolean',
              description:
                'True when there will be a continuation step with a continuation text.',
            },
            {
              name: 'providerMetadata',
              type: 'Record<string,Record<string,JSONValue>> | undefined',
              isOptional: true,
              description:
                'Optional metadata from the provider. The outer key is the provider name. The inner values are the metadata. Details depend on the provider.',
            },
          ],
        },
      ],
    },
    {
      name: 'textStream',
      type: 'AsyncIterableStream<string>',
      description:
        'A text stream that returns only the generated text deltas. You can use it as either an AsyncIterable or a ReadableStream. When an error occurs, the stream will throw the error.',
    },
    {
      name: 'fullStream',
      type: 'AsyncIterable<TextStreamPart<TOOLS>> & ReadableStream<TextStreamPart<TOOLS>>',
      description:
        'A stream with all events, including text deltas, tool calls, tool results, and errors. You can use it as either an AsyncIterable or a ReadableStream. Only errors that stop the stream, such as network errors, are thrown.',
      properties: [
        {
          type: 'TextStreamPart',
          description: 'Text content part from ContentPart<TOOLS>',
          parameters: [
            {
              name: 'type',
              type: "'text'",
              description: 'The type to identify the object as text.',
            },
            {
              name: 'text',
              type: 'string',
              description: 'The text content.',
            },
          ],
        },
        {
          type: 'TextStreamPart',
          description: 'Reasoning content part from ContentPart<TOOLS>',
          parameters: [
            {
              name: 'type',
              type: "'reasoning'",
              description: 'The type to identify the object as reasoning.',
            },
            {
              name: 'text',
              type: 'string',
              description: 'The reasoning text.',
            },
            {
              name: 'providerMetadata',
              type: 'ProviderMetadata',
              isOptional: true,
              description: 'Optional provider metadata for the reasoning.',
            },
          ],
        },

        {
          type: 'TextStreamPart',
          description: 'Source content part from ContentPart<TOOLS>',
          parameters: [
            {
              name: 'type',
              type: "'source'",
              description: 'The type to identify the object as source.',
            },
            {
              name: 'sourceType',
              type: "'url'",
              description: 'A URL source. This is returned by web search RAG models.',
            },
            {
              name: 'id',
              type: 'string',
              description: 'The ID of the source.',
            },
            {
              name: 'url',
              type: 'string',
              description: 'The URL of the source.',
            },
            {
              name: 'title',
              type: 'string',
              isOptional: true,
              description: 'The title of the source.',
            },
            {
              name: 'providerMetadata',
              type: 'ProviderMetadata',
              isOptional: true,
              description: 'Additional provider metadata for the source.',
            },
          ],
        },
        {
          type: 'TextStreamPart',
          description: 'File content part from ContentPart<TOOLS>',
          parameters: [
            {
              name: 'type',
              type: "'file'",
              description: 'The type to identify the object as file.',
            },
            {
              name: 'file',
              type: 'GeneratedFile',
              description: 'The file.',
              properties: [
                {
                  type: 'GeneratedFile',
                  parameters: [
                    {
                      name: 'base64',
                      type: 'string',
                      description: 'File as a base64 encoded string.',
                    },
                    {
                      name: 'uint8Array',
                      type: 'Uint8Array',
                      description: 'File as a Uint8Array.',
                    },
                    {
                      name: 'mediaType',
                      type: 'string',
                      description: 'The IANA media type of the file.',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'TextStreamPart',
          description: 'Tool call from ContentPart<TOOLS>',
          parameters: [
            {
              name: 'type',
              type: "'tool-call'",
              description: 'The type to identify the object as tool call.',
            },
            {
              name: 'toolCallId',
              type: 'string',
              description: 'The id of the tool call.',
            },
            {
              name: 'toolName',
              type: 'string',
              description:
                'The name of the tool, which typically would be the name of the function.',
            },
            {
              name: 'input',
              type: 'object based on tool parameters',
              description:
                'Parameters generated by the model to be used by the tool. The type is inferred from the tool definition.',
            },
          ],
        },
        {
          type: 'TextStreamPart',
          parameters: [
            {
              name: 'type',
              type: "'tool-call-streaming-start'",
              description:
                'Indicates the start of a tool call streaming. Only available when streaming tool calls.',
            },
            {
              name: 'toolCallId',
              type: 'string',
              description: 'The id of the tool call.',
            },
            {
              name: 'toolName',
              type: 'string',
              description:
                'The name of the tool, which typically would be the name of the function.',
            },
          ],
        },
        {
          type: 'TextStreamPart',
          parameters: [
            {
              name: 'type',
              type: "'tool-call-delta'",
              description:
                'The type to identify the object as tool call delta. Only available when streaming tool calls.',
            },
            {
              name: 'toolCallId',
              type: 'string',
              description: 'The id of the tool call.',
            },
            {
              name: 'toolName',
              type: 'string',
              description:
                'The name of the tool, which typically would be the name of the function.',
            },
            {
              name: 'argsTextDelta',
              type: 'string',
              description: 'The text delta of the tool call arguments.',
            },
          ],
        },
        {
          type: 'TextStreamPart',
          description: 'Tool result from ContentPart<TOOLS>',
          parameters: [
            {
              name: 'type',
              type: "'tool-result'",
              description: 'The type to identify the object as tool result.',
            },
            {
              name: 'toolCallId',
              type: 'string',
              description: 'The id of the tool call.',
            },
            {
              name: 'toolName',
              type: 'string',
              description:
                'The name of the tool, which typically would be the name of the function.',
            },
            {
              name: 'input',
              type: 'object based on tool parameters',
              description:
                'Parameters that were passed to the tool. The type is inferred from the tool definition.',
            },
            {
              name: 'output',
              type: 'tool execution return type',
              description:
                'The result returned by the tool after execution has completed. The type is inferred from the tool execute function return type.',
            },
          ],
        },
        {
          type: 'TextStreamPart',
          parameters: [
            {
              name: 'type',
              type: "'start-step'",
              description: 'Indicates the start of a new step in the stream.',
            },
            {
              name: 'request',
              type: 'LanguageModelRequestMetadata',
              description:
                'Information about the request that was sent to the language model provider.',
              properties: [
                {
                  type: 'LanguageModelRequestMetadata',
                  parameters: [
                    {
                      name: 'body',
                      type: 'string',
                      description:
                        'Raw request HTTP body that was sent to the provider API as a string.',
                    },
                  ],
                },
              ],
            },
            {
              name: 'warnings',
              type: 'CallWarning[]',
              description:
                'Warnings from the model provider (e.g. unsupported settings).',
            },
          ],
        },
        {
          type: 'TextStreamPart',
          parameters: [
            {
              name: 'type',
              type: "'finish-step'",
              description:
                'Indicates the end of the current step in the stream.',
            },
            {
              name: 'response',
              type: 'LanguageModelResponseMetadata',
              description:
                'Response metadata from the language model provider.',
              properties: [
                {
                  type: 'LanguageModelResponseMetadata',
                  parameters: [
                    {
                      name: 'id',
                      type: 'string',
                      description:
                        'The response identifier. The AI SDK uses the ID from the provider response when available, and generates an ID otherwise.',
                    },
                    {
                      name: 'model',
                      type: 'string',
                      description:
                        'The model that was used to generate the response. The AI SDK uses the response model from the provider response when available, and the model from the function call otherwise.',
                    },
                    {
                      name: 'timestamp',
                      type: 'Date',
                      description:
                        'The timestamp of the response. The AI SDK uses the response timestamp from the provider response when available, and creates a timestamp otherwise.',
                    },
                    {
                      name: 'headers',
                      type: 'Record<string, string>',
                      description: 'The response headers.',
                    },
                  ],
                },
              ],
            },
            {
              name: 'usage',
              type: 'LanguageModelUsage',
              description: 'The token usage of the generated text.',
              properties: [
                {
                  type: 'LanguageModelUsage',
                  parameters: [
                    {
                      name: 'inputTokens',
                      type: 'number | undefined',
                      description: 'The number of input (prompt) tokens used.',
                    },
                    {
                      name: 'outputTokens',
                      type: 'number | undefined',
                      description: 'The number of output (completion) tokens used.',
                    },
                    {
                      name: 'totalTokens',
                      type: 'number | undefined',
                      description:
                        'The total number of tokens as reported by the provider. This number might be different from the sum of inputTokens and outputTokens and e.g. include reasoning tokens or other overhead.',
                    },
                    {
                      name: 'reasoningTokens',
                      type: 'number | undefined',
                      isOptional: true,
                      description: 'The number of reasoning tokens used.',
                    },
                    {
                      name: 'cachedInputTokens',
                      type: 'number | undefined',
                      isOptional: true,
                      description: 'The number of cached input tokens.',
                    },
                  ],
                },
              ],
            },
            {
              name: 'finishReason',
              type: "'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown'",
              description: 'The reason the model finished generating the text.',
            },
            {
              name: 'providerMetadata',
              type: 'ProviderMetadata | undefined',
              isOptional: true,
              description:
                'Optional metadata from the provider. The outer key is the provider name. The inner values are the metadata. Details depend on the provider.',
            },
          ],
        },
        {
          type: 'TextStreamPart',
          parameters: [
            {
              name: 'type',
              type: "'start'",
              description: 'Indicates the start of the stream.',
            },
          ],
        },
        {
          type: 'TextStreamPart',
          parameters: [
            {
              name: 'type',
              type: "'finish'",
              description: 'The type to identify the object as finish.',
            },
            {
              name: 'finishReason',
              type: "'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown'",
              description: 'The reason the model finished generating the text.',
            },
            {
              name: 'totalUsage',
              type: 'LanguageModelUsage',
              description: 'The total token usage of the generated text.',
              properties: [
                {
                  type: 'LanguageModelUsage',
                  parameters: [
                    {
                      name: 'inputTokens',
                      type: 'number | undefined',
                      description: 'The number of input (prompt) tokens used.',
                    },
                    {
                      name: 'outputTokens',
                      type: 'number | undefined',
                      description: 'The number of output (completion) tokens used.',
                    },
                    {
                      name: 'totalTokens',
                      type: 'number | undefined',
                      description:
                        'The total number of tokens as reported by the provider. This number might be different from the sum of inputTokens and outputTokens and e.g. include reasoning tokens or other overhead.',
                    },
                    {
                      name: 'reasoningTokens',
                      type: 'number | undefined',
                      isOptional: true,
                      description: 'The number of reasoning tokens used.',
                    },
                    {
                      name: 'cachedInputTokens',
                      type: 'number | undefined',
                      isOptional: true,
                      description: 'The number of cached input tokens.',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'TextStreamPart',
          parameters: [
            {
              name: 'type',
              type: "'reasoning-part-finish'",
              description: 'Indicates the end of a reasoning part.',
            },
          ],
        },
        {
          type: 'TextStreamPart',
          parameters: [
            {
              name: 'type',
              type: "'error'",
              description: 'The type to identify the object as error.',
            },
            {
              name: 'error',
              type: 'unknown',
              description:
                'Describes the error that may have occurred during execution.',
            },
          ],
        },
        {
          type: 'TextStreamPart',
          parameters: [
            {
              name: 'type',
              type: "'abort'",
              description: 'The type to identify the object as abort.',
            },
          ],
        },
      ],
    },
    {
      name: 'experimental_partialOutputStream',
      type: 'AsyncIterableStream<PARTIAL_OUTPUT>',
      description:
        'A stream of partial outputs. It uses the `experimental_output` specification. AsyncIterableStream is defined as AsyncIterable<T> & ReadableStream<T>.',
    },
    {
      name: 'consumeStream',
      type: '(options?: ConsumeStreamOptions) => Promise<void>',
      description:
        'Consumes the stream without processing the parts. This is useful to force the stream to finish. If an error occurs, it is passed to the optional `onError` callback.',
      properties: [
        {
          type: 'ConsumeStreamOptions',
          parameters: [
            {
              name: 'onError',
              type: '(error: unknown) => void',
              isOptional: true,
              description: 'The error callback.',
            },
          ],
        },
      ],
    },
    {
      name: 'toUIMessageStream',
      type: '(options?: UIMessageStreamOptions) => AsyncIterableStream<UIMessageChunk>',
      description:
        'Converts the result to a UI message stream. Returns an AsyncIterableStream that can be used as both an AsyncIterable and a ReadableStream.',
      properties: [
        {
          type: 'UIMessageStreamOptions',
          parameters: [
            {
              name: 'originalMessages',
              type: 'UIMessage[]',
              isOptional: true,
              description: 'The original messages.',
            },
            {
              name: 'onFinish',
              type: '(options: { messages: UIMessage[]; isContinuation: boolean; responseMessage: UIMessage; isAborted: boolean; }) => void',
              isOptional: true,
              description: 'Callback function called when the stream finishes. Provides the updated list of UI messages, whether the response is a continuation, the response message, and whether the stream was aborted.',
            },
            {
              name: 'messageMetadata',
              type: '(options: { part: TextStreamPart<TOOLS> & { type: "start" | "finish" | "start-step" | "finish-step"; }; }) => unknown',
              isOptional: true,
              description: 'Extracts message metadata that will be sent to the client. Called on start and finish events.',
            },
            {
              name: 'sendReasoning',
              type: 'boolean',
              isOptional: true,
              description:
                'Send reasoning parts to the client. Defaults to false.',
            },
            {
              name: 'sendSources',
              type: 'boolean',
              isOptional: true,
              description:
                'Send source parts to the client. Defaults to false.',
            },
            {
              name: 'sendFinish',
              type: 'boolean',
              isOptional: true,
              description:
                'Send the finish event to the client. Defaults to true.',
            },
            {
              name: 'sendStart',
              type: 'boolean',
              isOptional: true,
              description:
                'Send the message start event to the client. Set to false if you are using additional streamText calls and the message start event has already been sent. Defaults to true.',
            },
            {
              name: 'onError',
              type: '(error: unknown) => string',
              isOptional: true,
              description:
                'Process an error, e.g. to log it. Returns error message to include in the data stream. Defaults to () => "An error occurred."',
            },
            {
              name: 'consumeSseStream',
              type: '(stream: ReadableStream) => Promise<void>',
              isOptional: true,
              description:
                'Function to consume the SSE stream. Required for proper abort handling in UI message streams. Use the `consumeStream` function from the AI SDK.',
            },
          ],
        },
      ],
    },
    {
      name: 'pipeUIMessageStreamToResponse',
      type: '(response: ServerResponse, options?: ResponseInit & UIMessageStreamOptions) => void',
      description:
        'Writes UI message stream output to a Node.js response-like object.',
      properties: [
        {
          type: 'ResponseInit & UIMessageStreamOptions',
          parameters: [
            {
              name: 'status',
              type: 'number',
              isOptional: true,
              description: 'The response status code.',
            },
            {
              name: 'statusText',
              type: 'string',
              isOptional: true,
              description: 'The response status text.',
            },
            {
              name: 'headers',
              type: 'HeadersInit',
              isOptional: true,
              description: 'The response headers.',
            },
          ],
        },
      ],
    },
    {
      name: 'pipeTextStreamToResponse',
      type: '(response: ServerResponse, init?: ResponseInit) => void',
      description:
        'Writes text delta output to a Node.js response-like object. It sets a `Content-Type` header to `text/plain; charset=utf-8` and writes each text delta as a separate chunk.',
      properties: [
        {
          type: 'ResponseInit',
          parameters: [
            {
              name: 'status',
              type: 'number',
              isOptional: true,
              description: 'The response status code.',
            },
            {
              name: 'statusText',
              type: 'string',
              isOptional: true,
              description: 'The response status text.',
            },
            {
              name: 'headers',
              type: 'Record<string, string>',
              isOptional: true,
              description: 'The response headers.',
            },
          ],
        },
      ],
    },
    {
      name: 'toUIMessageStreamResponse',
      type: '(options?: ResponseInit & UIMessageStreamOptions) => Response',
      description:
        'Converts the result to a streamed response object with a UI message stream.',
      properties: [
        {
          type: 'ResponseInit & UIMessageStreamOptions',
          parameters: [
            {
              name: 'status',
              type: 'number',
              isOptional: true,
              description: 'The response status code.',
            },
            {
              name: 'statusText',
              type: 'string',
              isOptional: true,
              description: 'The response status text.',
            },
            {
              name: 'headers',
              type: 'HeadersInit',
              isOptional: true,
              description: 'The response headers.',
            },
          ],
        },
      ],
    },
    {
      name: 'toTextStreamResponse',
      type: '(init?: ResponseInit) => Response',
      description:
        'Creates a simple text stream response. Each text delta is encoded as UTF-8 and sent as a separate chunk. Non-text-delta events are ignored.',
      properties: [
        {
          type: 'ResponseInit',
          parameters: [
            {
              name: 'status',
              type: 'number',
              isOptional: true,
              description: 'The response status code.',
            },
            {
              name: 'statusText',
              type: 'string',
              isOptional: true,
              description: 'The response status text.',
            },
            {
              name: 'headers',
              type: 'Record<string, string>',
              isOptional: true,
              description: 'The response headers.',
            },
          ],
        },
      ],
    },

]}
/>

## Examples

<ExampleLinks
  examples={[
    {
      title: 'Learn to stream text generated by a language model in Next.js',
      link: '/examples/next-app/basics/streaming-text-generation',
    },
    {
      title:
        'Learn to stream chat completions generated by a language model in Next.js',
      link: '/examples/next-app/chat/stream-chat-completion',
    },
    {
      title: 'Learn to stream text generated by a language model in Node.js',
      link: '/examples/node/generating-text/stream-text',
    },
    {
      title:
        'Learn to stream chat completions generated by a language model in Node.js',
      link: '/examples/node/generating-text/stream-text-with-chat-prompt',
    },
  ]}
/>




# Tools

While [large language models (LLMs)](/docs/foundations/overview#large-language-models) have incredible generation capabilities,
they struggle with discrete tasks (e.g. mathematics) and interacting with the outside world (e.g. getting the weather).

Tools are actions that an LLM can invoke.
The results of these actions can be reported back to the LLM to be considered in the next response.

For example, when you ask an LLM for the "weather in London", and there is a weather tool available, it could call a tool
with London as the argument. The tool would then fetch the weather data and return it to the LLM. The LLM can then use this
information in its response.

## What is a tool?

A tool is an object that can be called by the model to perform a specific task.
You can use tools with [`generateText`](/docs/reference/ai-sdk-core/generate-text)
and [`streamText`](/docs/reference/ai-sdk-core/stream-text) by passing one or more tools to the `tools` parameter.

A tool consists of three properties:

- **`description`**: An optional description of the tool that can influence when the tool is picked.
- **`inputSchema`**: A [Zod schema](/docs/foundations/tools#schema-specification-and-validation-with-zod) or a [JSON schema](/docs/reference/ai-sdk-core/json-schema) that defines the input required for the tool to run. The schema is consumed by the LLM, and also used to validate the LLM tool calls.
- **`execute`**: An optional async function that is called with the arguments from the tool call.

<Note>
  `streamUI` uses UI generator tools with a `generate` function that can return
  React components.
</Note>

If the LLM decides to use a tool, it will generate a tool call.
Tools with an `execute` function are run automatically when these calls are generated.
The output of the tool calls are returned using tool result objects.

You can automatically pass tool results back to the LLM
using [multi-step calls](/docs/ai-sdk-core/tools-and-tool-calling#multi-step-calls) with `streamText` and `generateText`.

## Schemas

Schemas are used to define the parameters for tools and to validate the [tool calls](/docs/ai-sdk-core/tools-and-tool-calling).

The AI SDK supports both raw JSON schemas (using the [`jsonSchema` function](/docs/reference/ai-sdk-core/json-schema))
and [Zod](https://zod.dev/) schemas (either directly or using the [`zodSchema` function](/docs/reference/ai-sdk-core/zod-schema)).

[Zod](https://zod.dev/) is a popular TypeScript schema validation library.
You can install it with:

<Tabs items={['pnpm', 'npm', 'yarn', 'bun']}>
  <Tab>
    <Snippet text="pnpm add zod" dark />
  </Tab>
  <Tab>
    <Snippet text="npm install zod" dark />
  </Tab>
  <Tab>
    <Snippet text="yarn add zod" dark />
  </Tab>

  <Tab>
    <Snippet text="bun add zod" dark />
  </Tab>
</Tabs>

You can then specify a Zod schema, for example:

```ts
import z from 'zod';

const recipeSchema = z.object({
  recipe: z.object({
    name: z.string(),
    ingredients: z.array(
      z.object({
        name: z.string(),
        amount: z.string(),
      }),
    ),
    steps: z.array(z.string()),
  }),
});
```

<Note>
  You can also use schemas for structured output generation with
  [`generateObject`](/docs/reference/ai-sdk-core/generate-object) and
  [`streamObject`](/docs/reference/ai-sdk-core/stream-object).
</Note>

## Tool Packages

Given tools are JavaScript objects, they can be packaged and distributed through npm like any other library. This makes it easy to share reusable tools across projects and with the community.

### Using Ready-Made Tool Packages

Install a tool package and import the tools you need:

```bash
pnpm add some-tool-package
```

Then pass them directly to `generateText`, `streamText`, or your agent definition:

```ts highlight="2, 8"
import { generateText, stepCountIs } from 'ai';
import { searchTool } from 'some-tool-package';

const { text } = await generateText({
  model: 'anthropic/claude-haiku-4.5',
  prompt: 'When was Vercel Ship AI?',
  tools: {
    webSearch: searchTool,
  },
  stopWhen: stepCountIs(10),
});
```

### Publishing Your Own Tools

You can publish your own tool packages to npm for others to use. Simply export your tool objects from your package:

```ts
// my-tools/index.ts
export const myTool = {
  description: 'A helpful tool',
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    // your tool logic
    return result;
  },
};
```

Anyone can then install and use your tools by importing them.

To get started, you can use the [AI SDK Tool Package Template](https://github.com/vercel-labs/ai-sdk-tool-as-package-template) which provides a ready-to-use starting point for publishing your own tools.

## Toolsets

When you work with tools, you typically need a mix of application-specific tools and general-purpose tools. The community has created various toolsets and resources to help you build and use tools.

### Ready-to-Use Tool Packages

These packages provide pre-built tools you can install and use immediately:

- **[@exalabs/ai-sdk](https://www.npmjs.com/package/@exalabs/ai-sdk)** - Web search tool that lets AI search the web and get real-time information.
- **[@parallel-web/ai-sdk-tools](https://www.npmjs.com/package/@parallel-web/ai-sdk-tools)** - Web search and extract tools powered by Parallel Web API for real-time information and content extraction.
- **[@perplexity-ai/ai-sdk](https://www.npmjs.com/package/@perplexity-ai/ai-sdk)** - Search the web with real-time results and advanced filtering powered by Perplexity's Search API.
- **[@tavily/ai-sdk](https://www.npmjs.com/package/@tavily/ai-sdk)** - Search, extract, crawl, and map tools for enterprise-grade agents to explore the web in real-time.
- **[Stripe agent tools](https://docs.stripe.com/agents?framework=vercel)** - Tools for interacting with Stripe.
- **[StackOne ToolSet](https://docs.stackone.com/agents/typescript/frameworks/vercel-ai-sdk)** - Agentic integrations for hundreds of [enterprise SaaS](https://www.stackone.com/integrations) platforms.
- **[agentic](https://docs.agentic.so/marketplace/ts-sdks/ai-sdk)** - A collection of 20+ tools that connect to external APIs such as [Exa](https://exa.ai/) or [E2B](https://e2b.dev/).
- **[Amazon Bedrock AgentCore](https://github.com/aws/bedrock-agentcore-sdk-typescript)** - Fully managed AI agent services including [**Browser**](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/built-in-tools.html) (a fast and secure cloud-based browser runtime to enable agents to interact with web applications, fill forms, navigate websites, and extract information) and [**Code Interpreter**](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/built-in-tools.html) (an isolated sandbox environment for agents to execute code in Python, JavaScript, and TypeScript, enhancing accuracy and expanding ability to solve complex end-to-end tasks).
- **[Composio](https://docs.composio.dev/providers/vercel)** - 250+ tools like GitHub, Gmail, Salesforce and [more](https://composio.dev/tools).
- **[JigsawStack](http://www.jigsawstack.com/docs/integration/vercel)** - Over 30+ small custom fine-tuned models available for specific uses.
- **[AI Tools Registry](https://ai-tools-registry.vercel.app)** - A Shadcn-compatible tool definitions and components registry for the AI SDK.
- **[Toolhouse](https://docs.toolhouse.ai/toolhouse/toolhouse-sdk/using-vercel-ai)** - AI function-calling in 3 lines of code for over 25 different actions.

### MCP Tools

These are pre-built tools available as MCP servers:

- **[Smithery](https://smithery.ai/docs/integrations/vercel_ai_sdk)** - An open marketplace of 6,000+ MCPs, including [Browserbase](https://browserbase.com/) and [Exa](https://exa.ai/).
- **[Pipedream](https://pipedream.com/docs/connect/mcp/ai-frameworks/vercel-ai-sdk)** - Developer toolkit that lets you easily add 3,000+ integrations to your app or AI agent.
- **[Apify](https://docs.apify.com/platform/integrations/vercel-ai-sdk)** - Apify provides a [marketplace](https://apify.com/store) of thousands of tools for web scraping, data extraction, and browser automation.

### Tool Building Tutorials

These tutorials and guides help you build your own tools that integrate with specific services:

- **[browserbase](https://docs.browserbase.com/integrations/vercel/introduction#vercel-ai-integration)** - Tutorial for building browser tools that run a headless browser.
- **[browserless](https://docs.browserless.io/ai-integrations/vercel-ai-sdk)** - Guide for integrating browser automation (self-hosted or cloud-based).
- **[AI Tool Maker](https://github.com/nihaocami/ai-tool-maker)** - A CLI utility to generate AI SDK tools from OpenAPI specs.
- **[Interlify](https://www.interlify.com/docs/integrate-with-vercel-ai)** - Guide for converting APIs into tools.
- **[DeepAgent](https://deepagent.amardeep.space/docs/vercel-ai-sdk)** - A suite of 50+ AI tools and integrations, seamlessly connecting with APIs like Tavily, E2B, Airtable and [more](https://deepagent.amardeep.space/docs).

<Note>
  Do you have open source tools or tool libraries that are compatible with the
  AI SDK? Please [file a pull request](https://github.com/vercel/ai/pulls) to
  add them to this list.
</Note>

## Learn more

The AI SDK Core [Tool Calling](/docs/ai-sdk-core/tools-and-tool-calling)
and [Agents](/docs/foundations/agents) documentation has more information about tools and tool calling.



# `useChat()`

Allows you to easily create a conversational user interface for your chatbot application. It enables the streaming of chat messages from your AI provider, manages the chat state, and updates the UI automatically as new messages are received.

<Note>
  The `useChat` API has been significantly updated in AI SDK 5.0. It now uses a
  transport-based architecture and no longer manages input state internally. See
  the [migration
  guide](/docs/migration-guides/migration-guide-5-0#usechat-changes) for
  details.
</Note>

## Import

<Tabs items={['React', 'Svelte', 'Vue']}>
  <Tab>
    <Snippet
      text="import { useChat } from '@ai-sdk/react'"
      dark
      prompt={false}
    />
  </Tab>
  <Tab>
    <Snippet text="import { Chat } from '@ai-sdk/svelte'" dark prompt={false} />
  </Tab>
  <Tab>
    <Snippet text="import { Chat } from '@ai-sdk/vue'" dark prompt={false} />
  </Tab>
</Tabs>

## API Signature

### Parameters

<PropertiesTable
  content={[
    {
      name: 'chat',
      type: 'Chat<UIMessage>',
      isOptional: true,
      description:
        'An existing Chat instance to use. If provided, other parameters are ignored.',
    },
    {
      name: 'transport',
      type: 'ChatTransport',
      isOptional: true,
      description:
        'The transport to use for sending messages. Defaults to DefaultChatTransport with `/api/chat` endpoint.',
      properties: [
        {
          type: 'DefaultChatTransport',
          parameters: [
            {
              name: 'api',
              type: "string = '/api/chat'",
              isOptional: true,
              description: 'The API endpoint for chat requests.',
            },
            {
              name: 'credentials',
              type: 'RequestCredentials',
              isOptional: true,
              description: 'The credentials mode for fetch requests.',
            },
            {
              name: 'headers',
              type: 'Record<string, string> | Headers',
              isOptional: true,
              description: 'HTTP headers to send with requests.',
            },
            {
              name: 'body',
              type: 'object',
              isOptional: true,
              description: 'Extra body object to send with requests.',
            },
            {
              name: 'prepareSendMessagesRequest',
              type: 'PrepareSendMessagesRequest',
              isOptional: true,
              description:
                'A function to customize the request before chat API calls.',
              properties: [
                {
                  type: 'PrepareSendMessagesRequest',
                  parameters: [
                    {
                      name: 'options',
                      type: 'PrepareSendMessageRequestOptions',
                      description: 'Options for preparing the request',
                      properties: [
                        {
                          type: 'PrepareSendMessageRequestOptions',
                          parameters: [
                            {
                              name: 'id',
                              type: 'string',
                              description: 'The chat ID',
                            },
                            {
                              name: 'messages',
                              type: 'UIMessage[]',
                              description: 'Current messages in the chat',
                            },
                            {
                              name: 'requestMetadata',
                              type: 'unknown',
                              description: 'The request metadata',
                            },
                            {
                              name: 'body',
                              type: 'Record<string, any> | undefined',
                              description: 'The request body',
                            },
                            {
                              name: 'credentials',
                              type: 'RequestCredentials | undefined',
                              description: 'The request credentials',
                            },
                            {
                              name: 'headers',
                              type: 'HeadersInit | undefined',
                              description: 'The request headers',
                            },
                            {
                              name: 'api',
                              type: 'string',
                              description: `The API endpoint to use for the request. If not specified, it defaults to the transport’s API endpoint: /api/chat.`,
                            },
                            {
                              name: 'trigger',
                              type: "'submit-message' | 'regenerate-message'",
                              description: 'The trigger for the request',
                            },
                            {
                              name: 'messageId',
                              type: 'string | undefined',
                              description: 'The message ID if applicable',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: 'prepareReconnectToStreamRequest',
              type: 'PrepareReconnectToStreamRequest',
              isOptional: true,
              description:
                'A function to customize the request before reconnect API call.',
              properties: [
                {
                  type: 'PrepareReconnectToStreamRequest',
                  parameters: [
                    {
                      name: 'options',
                      type: 'PrepareReconnectToStreamRequestOptions',
                      description:
                        'Options for preparing the reconnect request',
                      properties: [
                        {
                          type: 'PrepareReconnectToStreamRequestOptions',
                          parameters: [
                            {
                              name: 'id',
                              type: 'string',
                              description: 'The chat ID',
                            },
                            {
                              name: 'requestMetadata',
                              type: 'unknown',
                              description: 'The request metadata',
                            },
                            {
                              name: 'body',
                              type: 'Record<string, any> | undefined',
                              description: 'The request body',
                            },
                            {
                              name: 'credentials',
                              type: 'RequestCredentials | undefined',
                              description: 'The request credentials',
                            },
                            {
                              name: 'headers',
                              type: 'HeadersInit | undefined',
                              description: 'The request headers',
                            },
                            {
                              name: 'api',
                              type: 'string',
                              description: `The API endpoint to use for the request. If not specified, it defaults to the transport’s API endpoint combined with the chat ID: /api/chat/{chatId}/stream.`,
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'id',
      type: 'string',
      isOptional: true,
      description:
        'A unique identifier for the chat. If not provided, a random one will be generated.',
    },
    {
      name: 'messages',
      type: 'UIMessage[]',
      isOptional: true,
      description: 'Initial chat messages to populate the conversation with.',
    },
    {
      name: 'onToolCall',
      type: '({toolCall: ToolCall}) => void | Promise<void>',
      isOptional: true,
      description:
        'Optional callback function that is invoked when a tool call is received. You must call addToolOutput to provide the tool result.',
    },
    {
      name: 'sendAutomaticallyWhen',
      type: '(options: { messages: UIMessage[] }) => boolean | PromiseLike<boolean>',
      isOptional: true,
      description:
        'When provided, this function will be called when the stream is finished or a tool call is added to determine if the current messages should be resubmitted. You can use the lastAssistantMessageIsCompleteWithToolCalls helper for common scenarios.',
    },
    {
      name: 'onFinish',
      type: '(options: OnFinishOptions) => void',
      isOptional: true,
      description: 'Called when the assistant response has finished streaming.',
      properties: [
        {
          type: 'OnFinishOptions',
          parameters: [
            {
              name: 'message',
              type: 'UIMessage',
              description: 'The response message.',
            },
            {
              name: 'messages',
              type: 'UIMessage[]',
              description: 'All messages including the response message',
            },
            {
              name: 'isAbort',
              type: 'boolean',
              description:
                'True when the request has been aborted by the client.',
            },
            {
              name: 'isDisconnect',
              type: 'boolean',
              description:
                'True if the server has been disconnected, e.g. because of a network error.',
            },
            {
              name: 'isError',
              type: 'boolean',
              description: `True if errors during streaming caused the response to stop early.`,
            },
            {
              name: 'finishReason',
              type: "'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown'",
              isOptional: true,
              description:
                'The reason why the model finished generating the response. Undefined if the finish reason was not provided by the model.',
            },
          ],
        },
      ],
    },
    {
      name: 'onError',
      type: '(error: Error) => void',
      isOptional: true,
      description:
        'Callback function to be called when an error is encountered.',
    },
    {
      name: 'onData',
      type: '(dataPart: DataUIPart) => void',
      isOptional: true,
      description:
        'Optional callback function that is called when a data part is received.',
    },
    {
      name: 'experimental_throttle',
      type: 'number',
      isOptional: true,
      description:
        'Custom throttle wait in ms for the chat messages and data updates. Default is undefined, which disables throttling.',
    },
    {
      name: 'resume',
      type: 'boolean',
      isOptional: true,
      description:
        'Whether to resume an ongoing chat generation stream. Defaults to false.',
    },
  ]}
/>

### Returns

<PropertiesTable
  content={[
    {
      name: 'id',
      type: 'string',
      description: 'The id of the chat.',
    },
    {
      name: 'messages',
      type: 'UIMessage[]',
      description: 'The current array of chat messages.',
      properties: [
        {
          type: 'UIMessage',
          parameters: [
            {
              name: 'id',
              type: 'string',
              description: 'A unique identifier for the message.',
            },
            {
              name: 'role',
              type: "'system' | 'user' | 'assistant'",
              description: 'The role of the message.',
            },
            {
              name: 'parts',
              type: 'UIMessagePart[]',
              description:
                'The parts of the message. Use this for rendering the message in the UI.',
            },
            {
              name: 'metadata',
              type: 'unknown',
              isOptional: true,
              description: 'The metadata of the message.',
            },
          ],
        },
      ],
    },
    {
      name: 'status',
      type: "'submitted' | 'streaming' | 'ready' | 'error'",
      description:
        'The current status of the chat: "ready" (idle), "submitted" (request sent), "streaming" (receiving response), or "error" (request failed).',
    },
    {
      name: 'error',
      type: 'Error | undefined',
      description: 'The error object if an error occurred.',
    },
    {
      name: 'sendMessage',
      type: '(message: CreateUIMessage | string, options?: ChatRequestOptions) => void',
      description:
        'Function to send a new message to the chat. This will trigger an API call to generate the assistant response.',
      properties: [
        {
          type: 'ChatRequestOptions',
          parameters: [
            {
              name: 'headers',
              type: 'Record<string, string> | Headers',
              description:
                'Additional headers that should be to be passed to the API endpoint.',
            },
            {
              name: 'body',
              type: 'object',
              description:
                'Additional body JSON properties that should be sent to the API endpoint.',
            },
            {
              name: 'metadata',
              type: 'JSONValue',
              description: 'Additional data to be sent to the API endpoint.',
            },
          ],
        },
      ],
    },
    {
      name: 'regenerate',
      type: '(options?: { messageId?: string }) => void',
      description:
        'Function to regenerate the last assistant message or a specific message. If no messageId is provided, regenerates the last assistant message.',
    },
    {
      name: 'stop',
      type: '() => void',
      description:
        'Function to abort the current streaming response from the assistant.',
    },
    {
      name: 'clearError',
      type: '() => void',
      description: 'Clears the error state.',
    },
    {
      name: 'resumeStream',
      type: '() => void',
      description:
        'Function to resume an interrupted streaming response. Useful when a network error occurs during streaming.',
    },
    {
      name: 'addToolOutput',
      type: '(options: { tool: string; toolCallId: string; output: unknown } | { tool: string; toolCallId: string; state: "output-error", errorText: string }) => void',
      description:
        'Function to add a tool result to the chat. This will update the chat messages with the tool result. If sendAutomaticallyWhen is configured, it may trigger an automatic submission.',
    },
    {
      name: 'setMessages',
      type: '(messages: UIMessage[] | ((messages: UIMessage[]) => UIMessage[])) => void',
      description:
        'Function to update the messages state locally without triggering an API call. Useful for optimistic updates.',
    },
  ]}
/>

## Learn more

- [Chatbot](/docs/ai-sdk-ui/chatbot)
- [Chatbot with Tools](/docs/ai-sdk-ui/chatbot-with-tool-calling)
- [UIMessage](/docs/reference/ai-sdk-core/ui-message)



# `useCompletion()`

Allows you to create text completion based capabilities for your application. It enables the streaming of text completions from your AI provider, manages the state for chat input, and updates the UI automatically as new messages are received.

## Import

<Tabs items={['React', 'Svelte', 'Vue']}>
  <Tab>
    <Snippet
      text="import { useCompletion } from '@ai-sdk/react'"
      dark
      prompt={false}
    />
  </Tab>
  <Tab>
    <Snippet
      text="import { Completion } from '@ai-sdk/svelte'"
      dark
      prompt={false}
    />
  </Tab>
  <Tab>
    <Snippet
      text="import { useCompletion } from '@ai-sdk/vue'"
      dark
      prompt={false}
    />
  </Tab>

</Tabs>

## API Signature

### Parameters

<PropertiesTable
  content={[
    {
      name: 'api',
      type: "string = '/api/completion'",
      description:
        'The API endpoint that is called to generate text. It can be a relative path (starting with `/`) or an absolute URL.',
    },
    {
      name: 'id',
      type: 'string',
      description:
        'An unique identifier for the completion. If not provided, a random one will be generated. When provided, the `useCompletion` hook with the same `id` will have shared states across components. This is useful when you have multiple components showing the same chat stream',
    },
    {
      name: 'initialInput',
      type: 'string',
      description: 'An optional string for the initial prompt input.',
    },
    {
      name: 'initialCompletion',
      type: 'string',
      description: 'An optional string for the initial completion result.',
    },
    {
      name: 'onFinish',
      type: '(prompt: string, completion: string) => void',
      description:
        'An optional callback function that is called when the completion stream ends.',
    },
    {
      name: 'onError',
      type: '(error: Error) => void',
      description:
        'An optional callback that will be called when the chat stream encounters an error.',
    },
    {
      name: 'headers',
      type: 'Record<string, string> | Headers',
      description:
        'An optional object of headers to be passed to the API endpoint.',
    },
    {
      name: 'body',
      type: 'any',
      description:
        'An optional, additional body object to be passed to the API endpoint.',
    },
    {
      name: 'credentials',
      type: "'omit' | 'same-origin' | 'include'",
      description:
        'An optional literal that sets the mode of credentials to be used on the request. Defaults to same-origin.',
    },
    {
      name: 'streamProtocol',
      type: "'text' | 'data'",
      isOptional: true,
      description:
        'An optional literal that sets the type of stream to be used. Defaults to `data`. If set to `text`, the stream will be treated as a text stream.',
    },
    {
      name: 'fetch',
      type: 'FetchFunction',
      isOptional: true,
      description:
        'Optional. A custom fetch function to be used for the API call. Defaults to the global fetch function.',
    },
    {
      name: 'experimental_throttle',
      type: 'number',
      isOptional: true,
      description:
        'React only. Custom throttle wait time in milliseconds for the completion and data updates. When specified, throttles how often the UI updates during streaming. Default is undefined, which disables throttling.',
    },

]}
/>

### Returns

<PropertiesTable
  content={[
    {
      name: 'completion',
      type: 'string',
      description: 'The current text completion.',
    },
    {
      name: 'complete',
      type: '(prompt: string, options: { headers, body }) => void',
      description:
        'Function to execute text completion based on the provided prompt.',
    },
    {
      name: 'error',
      type: 'undefined | Error',
      description: 'The error thrown during the completion process, if any.',
    },
    {
      name: 'setCompletion',
      type: '(completion: string) => void',
      description: 'Function to update the `completion` state.',
    },
    {
      name: 'stop',
      type: '() => void',
      description: 'Function to abort the current API request.',
    },
    {
      name: 'input',
      type: 'string',
      description: 'The current value of the input field.',
    },
    {
      name: 'setInput',
      type: 'React.Dispatch<React.SetStateAction<string>>',
      description: 'The current value of the input field.',
    },
    {
      name: 'handleInputChange',
      type: '(event: any) => void',
      description:
        "Handler for the `onChange` event of the input field to control the input's value.",
    },
    {
      name: 'handleSubmit',
      type: '(event?: { preventDefault?: () => void }) => void',
      description:
        'Form submission handler that automatically resets the input field and appends a user message.',
    },
    {
      name: 'isLoading',
      type: 'boolean',
      description:
        'Boolean flag indicating whether a fetch operation is currently in progress.',
    },
  ]}
/>
