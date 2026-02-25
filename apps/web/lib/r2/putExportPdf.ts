import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getR2ConfigOrNull } from "./server";

function createClient(accountId: string, accessKeyId: string, secretAccessKey: string) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  });
}

export function buildExportPdfKey(input: {
  storybookId: string;
  exportTarget: "DIGITAL_PDF" | "HARDCOPY_PRINT_PDF";
  exportHash: string;
}) {
  return `exports/${input.storybookId}/${input.exportTarget}/${input.exportHash}.pdf`;
}

export async function putExportPdfToR2(input: {
  key: string;
  pdf: Buffer;
}) {
  const config = getR2ConfigOrNull();
  if (!config) {
    throw new Error("R2 is not configured.");
  }
  const client = createClient(config.accountId, config.accessKeyId, config.secretAccessKey);
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: input.key,
      Body: input.pdf,
      ContentType: "application/pdf"
    })
  );
  return {
    bucket: config.bucket,
    key: input.key
  };
}

