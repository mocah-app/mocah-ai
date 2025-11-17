import { NextRequest, NextResponse } from "next/server";
import { auth } from "@mocah/auth";
import { S3 } from "@/utils/s3Client";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const tigrisBucket = process.env.TIGRIS_BUCKET_NAME;

if (!tigrisBucket) {
  throw new Error("TIGRIS_BUCKET_NAME environment variable is not set");
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PNG, JPG, and SVG are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `logos/${session.user.id}/${timestamp}-${sanitizedFilename}`;

    // Upload to Tigris S3
    const putCommand = new PutObjectCommand({
      Bucket: tigrisBucket,
      Key: filePath,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        "user-id": session.user.id,
        "original-name": file.name,
        "upload-timestamp": timestamp.toString(),
      },
      ServerSideEncryption: "AES256", // Additional server-side encryption
    });

    await S3.send(putCommand);

    // Generate public URL for the uploaded file
    const url = `https://${tigrisBucket}.fly.storage.tigris.dev/${filePath}`;

    return NextResponse.json({
      url,
      filename: sanitizedFilename,
      size: file.size,
      type: file.type,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
