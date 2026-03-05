import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getR2ConfigOrNull } from "./server";

function createClient(accountId: string, accessKeyId: string, secretAccessKey: string) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export type ExportArtifactType = "pdf" | "docx" | "pptx";

const MIME_TYPES: Record<ExportArtifactType, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

const EXTENSIONS: Record<ExportArtifactType, string> = {
  pdf: "pdf",
  docx: "docx",
  pptx: "pptx",
};

export function buildExportArtifactKey(input: {
  storybookId: string;
  type: ExportArtifactType;
  jobId: string;
}): string {
  return `exports/${input.storybookId}/${input.type}/${input.jobId}.${EXTENSIONS[input.type]}`;
}

export function getExportMimeType(type: ExportArtifactType): string {
  return MIME_TYPES[type];
}

export function getExportExtension(type: ExportArtifactType): string {
  return EXTENSIONS[type];
}

export async function putExportArtifactToR2(input: {
  key: string;
  body: Buffer;
  type: ExportArtifactType;
}): Promise<{ bucket: string; key: string }> {
  const config = getR2ConfigOrNull();
  if (!config) {
    throw new Error("R2 is not configured.");
  }
  const client = createClient(config.accountId, config.accessKeyId, config.secretAccessKey);
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: MIME_TYPES[input.type],
    })
  );
  return { bucket: config.bucket, key: input.key };
}
