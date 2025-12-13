# Tigris S3 Storage Setup

This document outlines the Tigris Object Storage integration for file uploads in the Mocah project.

## Overview

Tigris is used for storing uploaded files (logos, brand assets, etc.) with S3-compatible API. The implementation is based on the AWS SDK for S3.

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Tigris S3 Configuration
TIGRIS_ENDPOINT_URL=https://fly.storage.tigris.dev
TIGRIS_ACCESS_KEY_ID=your-tigris-access-key-id
TIGRIS_SECRET_ACCESS_KEY=your-tigris-secret-access-key
TIGRIS_BUCKET_NAME=your-bucket-name

# Optional: Custom public URL domain (defaults to storage.mocah.ai)
TIGRIS_PUBLIC_URL=storage.mocah.ai
```

## Getting Tigris Credentials

1. Sign up at [Tigris.dev](https://www.tigrisdata.com/)
2. Create a new project
3. Create a bucket (e.g., `mocah-uploads`)
4. Generate access credentials (Access Key ID and Secret Access Key)
5. Copy the credentials to your `.env` file

## Implementation Details

### S3 Client (`src/utils/s3Client.ts`)

Creates and exports a configured S3Client instance using the Tigris endpoint and credentials.

```typescript
import { S3Client } from "@aws-sdk/client-s3";

export const S3 = new S3Client({
  region: "auto",
  endpoint: process.env.TIGRIS_AWS_ENDPOINT_URL_S3!,
  credentials: {
    accessKeyId: process.env.TIGRIS_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.TIGRIS_AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});
```

### Upload Route (`src/app/api/upload/logo/route.ts`)

Handles file uploads with the following features:

- **Authentication**: Verifies user session using Better Auth
- **Validation**: 
  - File type validation (PNG, JPG, SVG only)
  - File size limit (10MB max)
- **Upload**: Stores files in Tigris with path structure: `logos/{randomUUID}/{timestamp}-{filename}`
- **Metadata**: Stores user ID and organization ID in S3 object metadata (not in URL)
- **Public URL**: Returns public URL in format: `https://storage.mocah.ai/{filePath}`

### File Organization

Files are organized by random UUID to:
- Protect user privacy (no sensitive IDs in public URLs)
- Prevent enumeration attacks
- Prevent filename conflicts
- Support future user data deletion requirements via S3 metadata

```
bucket/
  └── logos/
      └── {randomUUID}/
          └── {timestamp}-{sanitizedFilename}
```

## Security Considerations

1. **File Validation**: Only specific file types are allowed (PNG, JPG, SVG)
2. **Size Limits**: Maximum file size is 10MB
3. **Filename Sanitization**: Special characters are removed from filenames
4. **User Authentication**: All uploads require authenticated session
5. **Privacy**: Random UUIDs used in paths to prevent ID exposure
6. **Metadata**: User ID and organization ID stored securely in S3 object metadata for tracking

## Dependencies

```json
{
  "@aws-sdk/client-s3": "^3.823.0",
  "@aws-sdk/s3-request-presigner": "^3.824.0"
}
```

## Testing

To test the upload functionality:

1. Ensure all environment variables are set
2. Start the development server
3. Navigate to the brand setup page
4. Upload a logo file
5. Verify the file appears in your Tigris bucket

## Public Access Configuration

Ensure your Tigris bucket is configured for public read access:

1. Go to your Tigris dashboard
2. Select your bucket
3. Configure bucket policy to allow public reads for uploaded files
4. Or configure bucket settings to make objects public by default

## Troubleshooting

### "Environment variable is not set" error
- Verify all Tigris environment variables are present in your `.env` file
- Restart the development server after adding environment variables

### "Failed to upload file" error
- Check Tigris credentials are correct
- Verify bucket name matches your Tigris bucket
- Check network connectivity to Tigris endpoint

### Files upload but URLs don't work
- Verify bucket has public read access enabled
- Check the bucket name in the URL matches your bucket
- Ensure no CORS issues (Tigris handles this automatically)

## Migration from Development

The previous implementation used base64 data URLs for development. All existing functionality remains the same, but files are now stored in Tigris instead of being returned as data URLs.

## Related Files

- `/apps/web/src/utils/s3Client.ts` - S3 client configuration
- `/apps/web/src/app/api/upload/logo/route.ts` - Upload API endpoint
- `/apps/web/package.json` - Dependencies

