# Nano Banana Pro

> Nano Banana Pro (a.k.a Nano Banana 2) is Google's new state-of-the-art image generation and editing model


## Overview

- **Endpoint**: `https://fal.run/fal-ai/nano-banana-pro`
- **Model ID**: `fal-ai/nano-banana-pro`
- **Category**: text-to-image
- **Kind**: inference
**Tags**: realism, typography



## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:


- **`prompt`** (`string`, _required_):
  The text prompt to generate an image from.
  - Examples: "An action shot of a black lab swimming in an inground suburban swimming pool. The camera is placed meticulously on the water line, dividing the image in half, revealing both the dogs head above water holding a tennis ball in it's mouth, and it's paws paddling underwater."

- **`num_images`** (`integer`, _optional_):
  The number of images to generate. Default value: `1`
  - Default: `1`
  - Range: `1` to `4`

- **`aspect_ratio`** (`AspectRatioEnum`, _optional_):
  The aspect ratio of the generated image. Default value: `"1:1"`
  - Default: `"1:1"`
  - Options: `"21:9"`, `"16:9"`, `"3:2"`, `"4:3"`, `"5:4"`, `"1:1"`, `"4:5"`, `"3:4"`, `"2:3"`, `"9:16"`

- **`output_format`** (`OutputFormatEnum`, _optional_):
  The format of the generated image. Default value: `"png"`
  - Default: `"png"`
  - Options: `"jpeg"`, `"png"`, `"webp"`

- **`sync_mode`** (`boolean`, _optional_):
  If `True`, the media will be returned as a data URI and the output data won't be available in the request history.
  - Default: `false`

- **`resolution`** (`ResolutionEnum`, _optional_):
  The resolution of the image to generate. Default value: `"1K"`
  - Default: `"1K"`
  - Options: `"1K"`, `"2K"`, `"4K"`

- **`limit_generations`** (`boolean`, _optional_):
  Experimental parameter to limit the number of generations from each round of prompting to 1. Set to `True` to to disregard any instructions in the prompt regarding the number of images to generate.
  - Default: `false`

- **`enable_web_search`** (`boolean`, _optional_):
  Enable web search for the image generation task. This will allow the model to use the latest information from the web to generate the image.
  - Default: `false`



**Required Parameters Example**:

```json
{
  "prompt": "An action shot of a black lab swimming in an inground suburban swimming pool. The camera is placed meticulously on the water line, dividing the image in half, revealing both the dogs head above water holding a tennis ball in it's mouth, and it's paws paddling underwater."
}
```

**Full Example**:

```json
{
  "prompt": "An action shot of a black lab swimming in an inground suburban swimming pool. The camera is placed meticulously on the water line, dividing the image in half, revealing both the dogs head above water holding a tennis ball in it's mouth, and it's paws paddling underwater.",
  "num_images": 1,
  "aspect_ratio": "1:1",
  "output_format": "png",
  "resolution": "1K"
}
```


### Output Schema

The API returns the following output format:

- **`images`** (`list<ImageFile>`, _required_):
  The generated images.
  - Array of ImageFile
  - Examples: [{"file_name":"nano-banana-t2i-output.png","content_type":"image/png","url":"https://storage.googleapis.com/falserverless/example_outputs/nano-banana-t2i-output.png"}]

- **`description`** (`string`, _required_):
  The description of the generated images.



**Example Response**:

```json
{
  "images": [
    {
      "file_name": "nano-banana-t2i-output.png",
      "content_type": "image/png",
      "url": "https://storage.googleapis.com/falserverless/example_outputs/nano-banana-t2i-output.png"
    }
  ],
  "description": ""
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://fal.run/fal-ai/nano-banana-pro \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "prompt": "An action shot of a black lab swimming in an inground suburban swimming pool. The camera is placed meticulously on the water line, dividing the image in half, revealing both the dogs head above water holding a tennis ball in it's mouth, and it's paws paddling underwater."
   }'
```

### Python

Ensure you have the Python client installed:

```bash
pip install fal-client
```

Then use the API client to make requests:

```python
import fal_client

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

result = fal_client.subscribe(
    "fal-ai/nano-banana-pro",
    arguments={
        "prompt": "An action shot of a black lab swimming in an inground suburban swimming pool. The camera is placed meticulously on the water line, dividing the image in half, revealing both the dogs head above water holding a tennis ball in it's mouth, and it's paws paddling underwater."
    },
    with_logs=True,
    on_queue_update=on_queue_update,
)
print(result)
```

### JavaScript

Ensure you have the JavaScript client installed:

```bash
npm install --save @fal-ai/client
```

Then use the API client to make requests:

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/nano-banana-pro", {
  input: {
    prompt: "An action shot of a black lab swimming in an inground suburban swimming pool. The camera is placed meticulously on the water line, dividing the image in half, revealing both the dogs head above water holding a tennis ball in it's mouth, and it's paws paddling underwater."
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);
```


## Additional Resources

### Documentation

- [Model Playground](https://fal.ai/models/fal-ai/nano-banana-pro)
- [API Documentation](https://fal.ai/models/fal-ai/nano-banana-pro/api)
- [OpenAPI Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/nano-banana-pro)

### fal.ai Platform

- [Platform Documentation](https://docs.fal.ai)
- [Python Client](https://docs.fal.ai/clients/python)
- [JavaScript Client](https://docs.fal.ai/clients/javascript)


# Nano Banana Pro

> Nano Banana Pro (a.k.a Nano Banana 2) is Google's new state-of-the-art image generation and editing model


## Overview

- **Endpoint**: `https://fal.run/fal-ai/nano-banana-pro/edit`
- **Model ID**: `fal-ai/nano-banana-pro/edit`
- **Category**: image-to-image
- **Kind**: inference
**Tags**: realism, typography



## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:


- **`prompt`** (`string`, _required_):
  The prompt for image editing.
  - Examples: "make a photo of the man driving the car down the california coastline"

- **`num_images`** (`integer`, _optional_):
  The number of images to generate. Default value: `1`
  - Default: `1`
  - Range: `1` to `4`

- **`aspect_ratio`** (`AspectRatioEnum`, _optional_):
  The aspect ratio of the generated image. Default value: `"auto"`
  - Default: `"auto"`
  - Options: `"auto"`, `"21:9"`, `"16:9"`, `"3:2"`, `"4:3"`, `"5:4"`, `"1:1"`, `"4:5"`, `"3:4"`, `"2:3"`, `"9:16"`

- **`output_format`** (`OutputFormatEnum`, _optional_):
  The format of the generated image. Default value: `"png"`
  - Default: `"png"`
  - Options: `"jpeg"`, `"png"`, `"webp"`

- **`sync_mode`** (`boolean`, _optional_):
  If `True`, the media will be returned as a data URI and the output data won't be available in the request history.
  - Default: `false`

- **`image_urls`** (`list<string>`, _required_):
  The URLs of the images to use for image-to-image generation or image editing.
  - Array of string
  - Examples: ["https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png","https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input-2.png"]

- **`resolution`** (`ResolutionEnum`, _optional_):
  The resolution of the image to generate. Default value: `"1K"`
  - Default: `"1K"`
  - Options: `"1K"`, `"2K"`, `"4K"`

- **`limit_generations`** (`boolean`, _optional_):
  Experimental parameter to limit the number of generations from each round of prompting to 1. Set to `True` to to disregard any instructions in the prompt regarding the number of images to generate.
  - Default: `false`

- **`enable_web_search`** (`boolean`, _optional_):
  Enable web search for the image generation task. This will allow the model to use the latest information from the web to generate the image.
  - Default: `false`



**Required Parameters Example**:

```json
{
  "prompt": "make a photo of the man driving the car down the california coastline",
  "image_urls": [
    "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png",
    "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input-2.png"
  ]
}
```

**Full Example**:

```json
{
  "prompt": "make a photo of the man driving the car down the california coastline",
  "num_images": 1,
  "aspect_ratio": "auto",
  "output_format": "png",
  "image_urls": [
    "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png",
    "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input-2.png"
  ],
  "resolution": "1K"
}
```


### Output Schema

The API returns the following output format:

- **`images`** (`list<ImageFile>`, _required_):
  The edited images.
  - Array of ImageFile
  - Examples: [{"file_name":"nano-banana-multi-edit-output.png","content_type":"image/png","url":"https://storage.googleapis.com/falserverless/example_outputs/nano-banana-multi-edit-output.png"}]

- **`description`** (`string`, _required_):
  The description of the generated images.



**Example Response**:

```json
{
  "images": [
    {
      "file_name": "nano-banana-multi-edit-output.png",
      "content_type": "image/png",
      "url": "https://storage.googleapis.com/falserverless/example_outputs/nano-banana-multi-edit-output.png"
    }
  ],
  "description": ""
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://fal.run/fal-ai/nano-banana-pro/edit \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "prompt": "make a photo of the man driving the car down the california coastline",
     "image_urls": [
       "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png",
       "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input-2.png"
     ]
   }'
```

### Python

Ensure you have the Python client installed:

```bash
pip install fal-client
```

Then use the API client to make requests:

```python
import fal_client

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

result = fal_client.subscribe(
    "fal-ai/nano-banana-pro/edit",
    arguments={
        "prompt": "make a photo of the man driving the car down the california coastline",
        "image_urls": ["https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png", "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input-2.png"]
    },
    with_logs=True,
    on_queue_update=on_queue_update,
)
print(result)
```

### JavaScript

Ensure you have the JavaScript client installed:

```bash
npm install --save @fal-ai/client
```

Then use the API client to make requests:

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
  input: {
    prompt: "make a photo of the man driving the car down the california coastline",
    image_urls: ["https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png", "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input-2.png"]
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);
```


## Additional Resources

### Documentation

- [Model Playground](https://fal.ai/models/fal-ai/nano-banana-pro/edit)
- [API Documentation](https://fal.ai/models/fal-ai/nano-banana-pro/edit/api)
- [OpenAPI Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/nano-banana-pro/edit)

### fal.ai Platform

- [Platform Documentation](https://docs.fal.ai)
- [Python Client](https://docs.fal.ai/clients/python)
- [JavaScript Client](https://docs.fal.ai/clients/javascript)



# Fal Provider

[Fal AI](https://fal.ai/) provides a generative media platform for developers with lightning-fast inference capabilities. Their platform offers optimized performance for running diffusion models, with speeds up to 4x faster than alternatives.

## Setup

The Fal provider is available via the `@ai-sdk/fal` module. You can install it with

<Tabs items={['pnpm', 'npm', 'yarn', 'bun']}>
  <Tab>
    <Snippet text="pnpm add @ai-sdk/fal" dark />
  </Tab>
  <Tab>
    <Snippet text="npm install @ai-sdk/fal" dark />
  </Tab>
  <Tab>
    <Snippet text="yarn add @ai-sdk/fal" dark />
  </Tab>

  <Tab>
    <Snippet text="bun add @ai-sdk/fal" dark />
  </Tab>
</Tabs>

## Provider Instance

You can import the default provider instance `fal` from `@ai-sdk/fal`:

```ts
import { fal } from '@ai-sdk/fal';
```

If you need a customized setup, you can import `createFal` and create a provider instance with your settings:

```ts
import { createFal } from '@ai-sdk/fal';

const fal = createFal({
  apiKey: 'your-api-key', // optional, defaults to FAL_API_KEY environment variable, falling back to FAL_KEY
  baseURL: 'custom-url', // optional
  headers: {
    /* custom headers */
  }, // optional
});
```

You can use the following optional settings to customize the Fal provider instance:

- **baseURL** _string_

  Use a different URL prefix for API calls, e.g. to use proxy servers.
  The default prefix is `https://fal.run`.

- **apiKey** _string_

  API key that is being sent using the `Authorization` header.
  It defaults to the `FAL_API_KEY` environment variable, falling back to `FAL_KEY`.

- **headers** _Record&lt;string,string&gt;_

  Custom headers to include in the requests.

- **fetch** _(input: RequestInfo, init?: RequestInit) => Promise&lt;Response&gt;_

  Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation.
  You can use it as a middleware to intercept requests,
  or to provide a custom fetch implementation for e.g. testing.

## Image Models

You can create Fal image models using the `.image()` factory method.
For more on image generation with the AI SDK see [generateImage()](/docs/reference/ai-sdk-core/generate-image).

### Basic Usage

```ts
import { fal } from '@ai-sdk/fal';
import { experimental_generateImage as generateImage } from 'ai';
import fs from 'fs';

const { image, providerMetadata } = await generateImage({
  model: fal.image('fal-ai/flux/dev'),
  prompt: 'A serene mountain landscape at sunset',
});

const filename = `image-${Date.now()}.png`;
fs.writeFileSync(filename, image.uint8Array);
console.log(`Image saved to ${filename}`);
```

Fal image models may return additional information for the images and the request.

Here are some examples of properties that may be set for each image

```js
providerMetadata.fal.images[0].nsfw; // boolean, image is not safe for work
providerMetadata.fal.images[0].width; // number, image width
providerMetadata.fal.images[0].height; // number, image height
providerMetadata.fal.images[0].content_type; // string, mime type of the image
```

### Model Capabilities

Fal offers many models optimized for different use cases. Here are a few popular examples. For a full list of models, see the [Fal AI Search Page](https://fal.ai/explore/search).

| Model                                          | Description                                                                                                                       |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `fal-ai/flux/dev`                              | FLUX.1 [dev] model for high-quality image generation                                                                              |
| `fal-ai/flux-pro/kontext`                      | FLUX.1 Kontext [pro] handles both text and reference images as inputs, enabling targeted edits and complex transformations        |
| `fal-ai/flux-pro/kontext/max`                  | FLUX.1 Kontext [max] with improved prompt adherence and typography generation                                                     |
| `fal-ai/flux-lora`                             | Super fast endpoint for FLUX.1 with LoRA support                                                                                  |
| `fal-ai/ideogram/character`                    | Generate consistent character appearances across multiple images. Maintain facial features, proportions, and distinctive traits   |
| `fal-ai/qwen-image`                            | Qwen-Image foundation model with significant advances in complex text rendering and precise image editing                         |
| `fal-ai/omnigen-v2`                            | Unified image generation model for Image Editing, Personalized Image Generation, Virtual Try-On, Multi Person Generation and more |
| `fal-ai/bytedance/dreamina/v3.1/text-to-image` | Dreamina showcases superior picture effects with improvements in aesthetics, precise and diverse styles, and rich details         |
| `fal-ai/recraft/v3/text-to-image`              | SOTA in image generation with vector art and brand style capabilities                                                             |
| `fal-ai/wan/v2.2-a14b/text-to-image`           | High-resolution, photorealistic images with fine-grained detail                                                                   |

Fal models support the following aspect ratios:

- 1:1 (square HD)
- 16:9 (landscape)
- 9:16 (portrait)
- 4:3 (landscape)
- 3:4 (portrait)
- 16:10 (1280x800)
- 10:16 (800x1280)
- 21:9 (2560x1080)
- 9:21 (1080x2560)

Key features of Fal models include:

- Up to 4x faster inference speeds compared to alternatives
- Optimized by the Fal Inference Engine™
- Support for real-time infrastructure
- Cost-effective scaling with pay-per-use pricing
- LoRA training capabilities for model personalization

#### Modify Image

Transform existing images using text prompts.

```ts
// Example: Modify existing image
await generateImage({
  model: fal.image('fal-ai/flux-pro/kontext'),
  prompt: 'Put a donut next to the flour.',
  providerOptions: {
    fal: {
      imageUrl:
        'https://v3.fal.media/files/rabbit/rmgBxhwGYb2d3pl3x9sKf_output.png',
    },
  },
});
```

### Provider Options

Fal image models support flexible provider options through the `providerOptions.fal` object. You can pass any parameters supported by the specific Fal model's API. Common options include:

- **imageUrl** - Reference image URL for image-to-image generation
- **strength** - Controls how much the output differs from the input image
- **guidanceScale** - Controls adherence to the prompt (range: 1-20)
- **numInferenceSteps** - Number of denoising steps (range: 1-50)
- **enableSafetyChecker** - Enable/disable safety filtering
- **outputFormat** - Output format: 'jpeg' or 'png'
- **syncMode** - Wait for completion before returning response
- **acceleration** - Speed of generation: 'none', 'regular', or 'high'
- **safetyTolerance** - Content safety filtering level (1-6, where 1 is strictest)

<Note type="warning">
  **Deprecation Notice**: snake_case parameter names (e.g., `image_url`,
  `guidance_scale`) are deprecated and will be removed in `@ai-sdk/fal` v2.0.
  Please use camelCase names (e.g., `imageUrl`, `guidanceScale`) instead.
</Note>

Refer to the [Fal AI model documentation](https://fal.ai/models) for model-specific parameters.

### Advanced Features

Fal's platform offers several advanced capabilities:

- **Private Model Inference**: Run your own diffusion transformer models with up to 50% faster inference
- **LoRA Training**: Train and personalize models in under 5 minutes
- **Real-time Infrastructure**: Enable new user experiences with fast inference times
- **Scalable Architecture**: Scale to thousands of GPUs when needed

For more details about Fal's capabilities and features, visit the [Fal AI documentation](https://fal.ai/docs).

## Transcription Models

You can create models that call the [Fal transcription API](https://docs.fal.ai/guides/convert-speech-to-text)
using the `.transcription()` factory method.

The first argument is the model id without the `fal-ai/` prefix e.g. `wizper`.

```ts
const model = fal.transcription('wizper');
```

You can also pass additional provider-specific options using the `providerOptions` argument. For example, supplying the `batchSize` option will increase the number of audio chunks processed in parallel.

```ts highlight="6"
import { experimental_transcribe as transcribe } from 'ai';
import { fal } from '@ai-sdk/fal';
import { readFile } from 'fs/promises';

const result = await transcribe({
  model: fal.transcription('wizper'),
  audio: await readFile('audio.mp3'),
  providerOptions: { fal: { batchSize: 10 } },
});
```

The following provider options are available:

- **language** _string_
  Language of the audio file. If set to null, the language will be automatically detected.
  Accepts ISO language codes like 'en', 'fr', 'zh', etc.
  Optional.

- **diarize** _boolean_
  Whether to diarize the audio file (identify different speakers).
  Defaults to true.
  Optional.

- **chunkLevel** _string_
  Level of the chunks to return. Either 'segment' or 'word'.
  Default value: "segment"
  Optional.

- **version** _string_
  Version of the model to use. All models are Whisper large variants.
  Default value: "3"
  Optional.

- **batchSize** _number_
  Batch size for processing.
  Default value: 64
  Optional.

- **numSpeakers** _number_
  Number of speakers in the audio file. If not provided, the number of speakers will be automatically detected.
  Optional.

### Model Capabilities

| Model     | Transcription       | Duration            | Segments            | Language            |
| --------- | ------------------- | ------------------- | ------------------- | ------------------- |
| `whisper` | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `wizper`  | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |

## Speech Models

You can create models that call Fal text-to-speech endpoints using the `.speech()` factory method.

### Basic Usage

```ts
import { experimental_generateSpeech as generateSpeech } from 'ai';
import { fal } from '@ai-sdk/fal';

const result = await generateSpeech({
  model: fal.speech('fal-ai/minimax/speech-02-hd'),
  text: 'Hello from the AI SDK!',
});
```

### Model Capabilities

| Model                                     | Description                                                                                                                                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fal-ai/minimax/voice-clone`              | Clone a voice from a sample audio and generate speech from text prompts                                                                                               |
| `fal-ai/minimax/voice-design`             | Design a personalized voice from a text description and generate speech from text prompts                                                                             |
| `fal-ai/dia-tts/voice-clone`              | Clone dialog voices from a sample audio and generate dialogs from text prompts                                                                                        |
| `fal-ai/minimax/speech-02-hd`             | Generate speech from text prompts and different voices                                                                                                                |
| `fal-ai/minimax/speech-02-turbo`          | Generate fast speech from text prompts and different voices                                                                                                           |
| `fal-ai/dia-tts`                          | Directly generates realistic dialogue from transcripts with audio conditioning for emotion control. Produces natural nonverbals like laughter and throat clearing     |
| `resemble-ai/chatterboxhd/text-to-speech` | Generate expressive, natural speech with Resemble AI's Chatterbox. Features unique emotion control, instant voice cloning from short audio, and built-in watermarking |

### Provider Options

Pass provider-specific options via `providerOptions.fal` depending on the model:

- **voice_setting** _object_

  - `voice_id` (string): predefined voice ID
  - `speed` (number): 0.5–2.0
  - `vol` (number): 0–10
  - `pitch` (number): -12–12
  - `emotion` (enum): happy | sad | angry | fearful | disgusted | surprised | neutral
  - `english_normalization` (boolean)

- **audio_setting** _object_
  Audio configuration settings specific to the model.

- **language_boost** _enum_
  Chinese | Chinese,Yue | English | Arabic | Russian | Spanish | French | Portuguese | German | Turkish | Dutch | Ukrainian | Vietnamese | Indonesian | Japanese | Italian | Korean | Thai | Polish | Romanian | Greek | Czech | Finnish | Hindi | auto

- **pronunciation_dict** _object_
  Custom pronunciation dictionary for specific words.

Model-specific parameters (e.g., `audio_url`, `prompt`, `preview_text`, `ref_audio_url`, `ref_text`) can be passed directly under `providerOptions.fal` and will be forwarded to the Fal API.


# Qwen Image

> Qwen-Image is an image generation foundation model in the Qwen series that achieves significant advances in complex text rendering and precise image editing. 


## Overview

- **Endpoint**: `https://fal.run/fal-ai/qwen-image`
- **Model ID**: `fal-ai/qwen-image`
- **Category**: text-to-image
- **Kind**: inference
**Tags**: text-to-image



## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:


- **`prompt`** (`string`, _required_):
  The prompt to generate the image with
  - Examples: "Mount Fuji with cherry blossoms in the foreground, clear sky, peaceful spring day, soft natural light, realistic landscape."

- **`image_size`** (`ImageSize | Enum`, _optional_):
  The size of the generated image. Default value: `landscape_4_3`
  - Default: `"landscape_4_3"`
  - One of: ImageSize | Enum

- **`num_inference_steps`** (`integer`, _optional_):
  The number of inference steps to perform. Default value: `30`
  - Default: `30`
  - Range: `2` to `250`

- **`seed`** (`integer`, _optional_):
  The same seed and the same prompt given to the same version of the model
  will output the same image every time.

- **`guidance_scale`** (`float`, _optional_):
  The CFG (Classifier Free Guidance) scale is a measure of how close you want
  the model to stick to your prompt when looking for a related image to show you. Default value: `2.5`
  - Default: `2.5`
  - Range: `0` to `20`

- **`sync_mode`** (`boolean`, _optional_):
  If `True`, the media will be returned as a data URI and the output data won't be available in the request history.
  - Default: `false`

- **`num_images`** (`integer`, _optional_):
  The number of images to generate. Default value: `1`
  - Default: `1`
  - Range: `1` to `4`

- **`enable_safety_checker`** (`boolean`, _optional_):
  If set to true, the safety checker will be enabled. Default value: `true`
  - Default: `true`

- **`output_format`** (`OutputFormatEnum`, _optional_):
  The format of the generated image. Default value: `"png"`
  - Default: `"png"`
  - Options: `"jpeg"`, `"png"`

- **`negative_prompt`** (`string`, _optional_):
  The negative prompt for the generation Default value: `" "`
  - Default: `" "`
  - Examples: "blurry, ugly"

- **`acceleration`** (`AccelerationEnum`, _optional_):
  Acceleration level for image generation. Options: 'none', 'regular', 'high'. Higher acceleration increases speed. 'regular' balances speed and quality. 'high' is recommended for images without text. Default value: `"none"`
  - Default: `"none"`
  - Options: `"none"`, `"regular"`, `"high"`
  - Examples: "none"

- **`loras`** (`list<LoraWeight>`, _optional_):
  The LoRAs to use for the image generation. You can use up to 3 LoRAs
  and they will be merged together to generate the final image.
  - Default: `[]`
  - Array of LoraWeight

- **`use_turbo`** (`boolean`, _optional_):
  Enable turbo mode for faster generation with high quality. When enabled, uses optimized settings (10 steps, CFG=1.2).
  - Default: `false`
  - Examples: true



**Required Parameters Example**:

```json
{
  "prompt": "Mount Fuji with cherry blossoms in the foreground, clear sky, peaceful spring day, soft natural light, realistic landscape."
}
```

**Full Example**:

```json
{
  "prompt": "Mount Fuji with cherry blossoms in the foreground, clear sky, peaceful spring day, soft natural light, realistic landscape.",
  "image_size": "landscape_4_3",
  "num_inference_steps": 30,
  "guidance_scale": 2.5,
  "num_images": 1,
  "enable_safety_checker": true,
  "output_format": "png",
  "negative_prompt": "blurry, ugly",
  "acceleration": "none",
  "use_turbo": true
}
```


### Output Schema

The API returns the following output format:

- **`images`** (`list<Image>`, _required_):
  The generated image files info.
  - Array of Image
  - Examples: [{"height":768,"content_type":"image/jpeg","url":"https://v3.fal.media/files/rabbit/KoIbq6nhDBDPxDQrivW-m.png","width":1024}]

- **`timings`** (`Timings`, _required_)

- **`seed`** (`integer`, _required_):
  Seed of the generated Image. It will be the same value of the one passed in the
  input or the randomly generated that was used in case none was passed.

- **`has_nsfw_concepts`** (`list<boolean>`, _required_):
  Whether the generated images contain NSFW concepts.
  - Array of boolean

- **`prompt`** (`string`, _required_):
  The prompt used for generating the image.



**Example Response**:

```json
{
  "images": [
    {
      "height": 768,
      "content_type": "image/jpeg",
      "url": "https://v3.fal.media/files/rabbit/KoIbq6nhDBDPxDQrivW-m.png",
      "width": 1024
    }
  ],
  "prompt": ""
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://fal.run/fal-ai/qwen-image \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "prompt": "Mount Fuji with cherry blossoms in the foreground, clear sky, peaceful spring day, soft natural light, realistic landscape."
   }'
```

### Python

Ensure you have the Python client installed:

```bash
pip install fal-client
```

Then use the API client to make requests:

```python
import fal_client

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

result = fal_client.subscribe(
    "fal-ai/qwen-image",
    arguments={
        "prompt": "Mount Fuji with cherry blossoms in the foreground, clear sky, peaceful spring day, soft natural light, realistic landscape."
    },
    with_logs=True,
    on_queue_update=on_queue_update,
)
print(result)
```

### JavaScript

Ensure you have the JavaScript client installed:

```bash
npm install --save @fal-ai/client
```

Then use the API client to make requests:

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/qwen-image", {
  input: {
    prompt: "Mount Fuji with cherry blossoms in the foreground, clear sky, peaceful spring day, soft natural light, realistic landscape."
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);
```


## Additional Resources

### Documentation

- [Model Playground](https://fal.ai/models/fal-ai/qwen-image)
- [API Documentation](https://fal.ai/models/fal-ai/qwen-image/api)
- [OpenAPI Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/qwen-image)

### fal.ai Platform

- [Platform Documentation](https://docs.fal.ai)
- [Python Client](https://docs.fal.ai/clients/python)
- [JavaScript Client](https://docs.fal.ai/clients/javascript)


# Qwen Image

> Qwen-Image is an image generation foundation model in the Qwen series that achieves significant advances in complex text rendering and precise image editing. 


## Overview

- **Endpoint**: `https://fal.run/fal-ai/qwen-image`
- **Model ID**: `fal-ai/qwen-image`
- **Category**: text-to-image
- **Kind**: inference
**Tags**: text-to-image



## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:


- **`prompt`** (`string`, _required_):
  The prompt to generate the image with
  - Examples: "Mount Fuji with cherry blossoms in the foreground, clear sky, peaceful spring day, soft natural light, realistic landscape."

- **`image_size`** (`ImageSize | Enum`, _optional_):
  The size of the generated image. Default value: `landscape_4_3`
  - Default: `"landscape_4_3"`
  - One of: ImageSize | Enum

- **`num_inference_steps`** (`integer`, _optional_):
  The number of inference steps to perform. Default value: `30`
  - Default: `30`
  - Range: `2` to `250`

- **`seed`** (`integer`, _optional_):
  The same seed and the same prompt given to the same version of the model
  will output the same image every time.

- **`guidance_scale`** (`float`, _optional_):
  The CFG (Classifier Free Guidance) scale is a measure of how close you want
  the model to stick to your prompt when looking for a related image to show you. Default value: `2.5`
  - Default: `2.5`
  - Range: `0` to `20`

- **`sync_mode`** (`boolean`, _optional_):
  If `True`, the media will be returned as a data URI and the output data won't be available in the request history.
  - Default: `false`

- **`num_images`** (`integer`, _optional_):
  The number of images to generate. Default value: `1`
  - Default: `1`
  - Range: `1` to `4`

- **`enable_safety_checker`** (`boolean`, _optional_):
  If set to true, the safety checker will be enabled. Default value: `true`
  - Default: `true`

- **`output_format`** (`OutputFormatEnum`, _optional_):
  The format of the generated image. Default value: `"png"`
  - Default: `"png"`
  - Options: `"jpeg"`, `"png"`

- **`negative_prompt`** (`string`, _optional_):
  The negative prompt for the generation Default value: `" "`
  - Default: `" "`
  - Examples: "blurry, ugly"

- **`acceleration`** (`AccelerationEnum`, _optional_):
  Acceleration level for image generation. Options: 'none', 'regular', 'high'. Higher acceleration increases speed. 'regular' balances speed and quality. 'high' is recommended for images without text. Default value: `"none"`
  - Default: `"none"`
  - Options: `"none"`, `"regular"`, `"high"`
  - Examples: "none"

- **`loras`** (`list<LoraWeight>`, _optional_):
  The LoRAs to use for the image generation. You can use up to 3 LoRAs
  and they will be merged together to generate the final image.
  - Default: `[]`
  - Array of LoraWeight

- **`use_turbo`** (`boolean`, _optional_):
  Enable turbo mode for faster generation with high quality. When enabled, uses optimized settings (10 steps, CFG=1.2).
  - Default: `false`
  - Examples: true



**Required Parameters Example**:

```json
{
  "prompt": "Mount Fuji with cherry blossoms in the foreground, clear sky, peaceful spring day, soft natural light, realistic landscape."
}
```

**Full Example**:

```json
{
  "prompt": "Mount Fuji with cherry blossoms in the foreground, clear sky, peaceful spring day, soft natural light, realistic landscape.",
  "image_size": "landscape_4_3",
  "num_inference_steps": 30,
  "guidance_scale": 2.5,
  "num_images": 1,
  "enable_safety_checker": true,
  "output_format": "png",
  "negative_prompt": "blurry, ugly",
  "acceleration": "none",
  "use_turbo": true
}
```


### Output Schema

The API returns the following output format:

- **`images`** (`list<Image>`, _required_):
  The generated image files info.
  - Array of Image
  - Examples: [{"height":768,"content_type":"image/jpeg","url":"https://v3.fal.media/files/rabbit/KoIbq6nhDBDPxDQrivW-m.png","width":1024}]

- **`timings`** (`Timings`, _required_)

- **`seed`** (`integer`, _required_):
  Seed of the generated Image. It will be the same value of the one passed in the
  input or the randomly generated that was used in case none was passed.

- **`has_nsfw_concepts`** (`list<boolean>`, _required_):
  Whether the generated images contain NSFW concepts.
  - Array of boolean

- **`prompt`** (`string`, _required_):
  The prompt used for generating the image.



**Example Response**:

```json
{
  "images": [
    {
      "height": 768,
      "content_type": "image/jpeg",
      "url": "https://v3.fal.media/files/rabbit/KoIbq6nhDBDPxDQrivW-m.png",
      "width": 1024
    }
  ],
  "prompt": ""
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://fal.run/fal-ai/qwen-image \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "prompt": "Mount Fuji with cherry blossoms in the foreground, clear sky, peaceful spring day, soft natural light, realistic landscape."
   }'
```

### Python

Ensure you have the Python client installed:

```bash
pip install fal-client
```

Then use the API client to make requests:

```python
import fal_client

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

result = fal_client.subscribe(
    "fal-ai/qwen-image",
    arguments={
        "prompt": "Mount Fuji with cherry blossoms in the foreground, clear sky, peaceful spring day, soft natural light, realistic landscape."
    },
    with_logs=True,
    on_queue_update=on_queue_update,
)
print(result)
```

### JavaScript

Ensure you have the JavaScript client installed:

```bash
npm install --save @fal-ai/client
```

Then use the API client to make requests:

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/qwen-image", {
  input: {
    prompt: "Mount Fuji with cherry blossoms in the foreground, clear sky, peaceful spring day, soft natural light, realistic landscape."
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);
```


## Additional Resources

### Documentation

- [Model Playground](https://fal.ai/models/fal-ai/qwen-image)
- [API Documentation](https://fal.ai/models/fal-ai/qwen-image/api)
- [OpenAPI Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/qwen-image)

### fal.ai Platform

- [Platform Documentation](https://docs.fal.ai)
- [Python Client](https://docs.fal.ai/clients/python)
- [JavaScript Client](https://docs.fal.ai/clients/javascript)
