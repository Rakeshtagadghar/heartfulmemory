import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string | null;
};

function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID ?? "";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? "";
  const bucket = process.env.R2_BUCKET ?? "";
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL ?? null;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl };
}

function createClient(config: R2Config) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });
}

export function getR2ConfigOrNull() {
  return getR2Config();
}

export async function signR2PutObject(input: {
  key: string;
  mimeType: string;
  expiresInSeconds?: number;
}) {
  const config = getR2Config();
  if (!config) throw new Error("R2 is not configured.");
  const client = createClient(config);
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: input.key,
    ContentType: input.mimeType
  });
  const url = await getSignedUrl(client, command, { expiresIn: input.expiresInSeconds ?? 300 });
  return {
    uploadUrl: url,
    key: input.key,
    bucket: config.bucket,
    headersRequired: {
      "content-type": input.mimeType
    }
  };
}

export async function signR2GetObject(input: {
  key: string;
  expiresInSeconds?: number;
}) {
  const config = getR2Config();
  if (!config) throw new Error("R2 is not configured.");

  if (config.publicBaseUrl) {
    return `${config.publicBaseUrl.replace(/\/$/, "")}/${input.key}`;
  }

  const client = createClient(config);
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: input.key
  });
  return getSignedUrl(client, command, { expiresIn: input.expiresInSeconds ?? 300 });
}
