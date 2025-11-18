/*
@deprecated This file is deprecated and will be removed after the migration to tRPC
*/

// import { S3Client } from "@aws-sdk/client-s3";

// const endpoint = process.env.TIGRIS_ENDPOINT_URL!;
// const accessKeyId = process.env.TIGRIS_ACCESS_KEY_ID!;
// const secretAccessKey = process.env.TIGRIS_SECRET_ACCESS_KEY!;

// if (!endpoint || !accessKeyId || !secretAccessKey) {
//   throw new Error(
//     "TIGRIS_ENDPOINT_URL, TIGRIS_ACCESS_KEY_ID, and TIGRIS_SECRET_ACCESS_KEY must be set"
//   );
// }

// export const S3 = new S3Client({
//   region: "auto",
//   endpoint: endpoint,
//   credentials: {
//     accessKeyId: accessKeyId,
//     secretAccessKey: secretAccessKey,
//   },
//   forcePathStyle: true,
// });
