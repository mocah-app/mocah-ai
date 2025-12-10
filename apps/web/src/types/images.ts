export interface Attachment {
    id: string;
    url: string;
    type: "upload" | "url";
    status: "uploading" | "ready" | "error";
    previewUrl: string;
    fileName?: string;
  }