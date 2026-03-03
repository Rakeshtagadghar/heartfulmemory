import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

export function hashPassword(password: string) {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P
  }).toString("hex");

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const parts = storedHash.split("$");
  if (parts.length !== 6) return false;
  const [algorithm, nValue, rValue, pValue, salt, hash] = parts;
  if (algorithm !== "scrypt") return false;

  const N = Number(nValue);
  const r = Number(rValue);
  const p = Number(pValue);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  const derived = scryptSync(password, salt, hash.length / 2, {
    N,
    r,
    p
  });
  const storedBuffer = Buffer.from(hash, "hex");

  if (storedBuffer.length !== derived.length) return false;

  return timingSafeEqual(storedBuffer, derived);
}