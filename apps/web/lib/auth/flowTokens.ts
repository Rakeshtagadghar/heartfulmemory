import { createHash, randomBytes } from "node:crypto";

const DEFAULT_TOKEN_BYTES = 32;

export function generateFlowToken(byteLength = DEFAULT_TOKEN_BYTES) {
  return randomBytes(byteLength).toString("hex");
}

export function hashFlowToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createFlowTokenRecord() {
  const token = generateFlowToken();
  return {
    token,
    tokenHash: hashFlowToken(token)
  };
}