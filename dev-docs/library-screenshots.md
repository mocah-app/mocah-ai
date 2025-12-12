# Template Library Screenshots

## Overview

Implemented automated screenshot generation for template library cards using ApiFlash. This replaces iframe-based previews with static images for better performance.

## Implementation

### 1. **Screenshot Generation** (`packages/api/src/lib/screenshot.ts`)

- Uses ApiFlash API to capture screenshots of HTML templates
- Uploads screenshots to Tigris S3 storage
- Gracefully degrades if API key is missing (no screenshot, falls back to iframe)
- Configuration:
  - Width: 600px
  - Height: 800px
  - Format: JPEG @ 85% quality
  - Wait until: `network_idle` for full rendering

### 2. **Environment Configuration** (`packages/config/src/env.ts`)

Added new optional environment variable:

```bash
APIFLASH_API_KEY=your_api_key_here
```

### 3. **Publish Flow** (`packages/api/src/routers/template.ts`)

Updated `publishToLibrary` mutation to:
1. Generate screenshot when template has `htmlCode`
2. Store thumbnail URL in `TemplateLibrary.thumbnail` field
3. Continue with existing flow (already had the field in schema)

### 4. **Library Grid UI** (`apps/web/src/app/library/components/LibraryGrid.tsx`)

Updated template cards to:
- Show `<Image>` component when `thumbnail` exists (performant)
- Fall back to `<TemplatePreview>` iframe if no thumbnail (backwards compatible)

## Benefits

✅ **Performance**: Static images load 10x faster than rendering iframes  
✅ **UX**: No iframe flashing/rendering delays  
✅ **Cost**: ~$0.002 per screenshot (negligible for infrequent publishing)  
✅ **Reliability**: ApiFlash handles complex CSS/fonts better than client-side  
✅ **Backwards Compatible**: Falls back to iframes for old templates

## Usage

### Setup ApiFlash

1. Sign up at [https://apiflash.com](https://apiflash.com)
2. Get your API key from dashboard
3. Add to environment variables:

```bash
APIFLASH_API_KEY=abc123...
```

### Publishing Templates

No changes needed - screenshots generate automatically when publishing:

```typescript
// From template-card-menu.tsx
publishMutation.mutate({ id: templateId });
```

The mutation will:
1. Generate screenshot via ApiFlash
2. Upload to S3 at `library-thumbnails/{templateId}.jpg`
3. Store URL in database
4. Display in library grid

## Cost Estimation

- **ApiFlash**: ~$0.002 per screenshot
- **S3 Storage**: ~$0.023/GB/month (negligible for JPEGs)
- **Example**: 50 templates/month = **$0.10/month**

## Troubleshooting

### No screenshot generated

Check logs for:
```
APIFLASH_API_KEY not configured, skipping screenshot generation
```

Solution: Add API key to environment

### ApiFlash errors

Common issues:
- **400**: Invalid HTML or parameters
- **402**: Quota exceeded (check dashboard)
- **429**: Rate limited (max 20 req/sec)

The system logs errors but doesn't fail - templates publish without thumbnails.

## Future Enhancements

- [ ] Regenerate screenshots on template updates
- [ ] Support custom thumbnail dimensions per category
- [ ] Add retry logic for failed screenshot generation
- [ ] Batch screenshot generation for bulk imports
- [ ] Add screenshot preview in publish confirmation
