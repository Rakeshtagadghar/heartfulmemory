function sanitizeSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9-_]+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "");
}

function extensionFromName(fileName: string) {
  const ext = fileName.split(".").at(-1)?.toLowerCase() ?? "";
  return /^[a-z0-9]{1,8}$/.test(ext) ? ext : "bin";
}

function randomId() {
  try {
    return globalThis.crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function generateUploadObjectKey(input: {
  userId: string;
  storybookId?: string | null;
  fileName: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const user = sanitizeSegment(input.userId).slice(0, 80) || "user";
  const storybook = input.storybookId ? sanitizeSegment(input.storybookId).slice(0, 80) : "unscoped";
  const ext = extensionFromName(input.fileName);
  const id = randomId();
  return `${user}/${storybook}/${yyyy}/${mm}/${dd}/${id}.${ext}`;
}
