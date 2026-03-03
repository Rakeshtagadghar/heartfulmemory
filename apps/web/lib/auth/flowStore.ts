import { anyApi, convexMutation, convexQuery, getConvexUrl } from "../convex/ops";

type AuthFlowPurpose = "password_reset" | "email_verification" | "email_sign_in";

type CreateTokenInput = {
  purpose: AuthFlowPurpose;
  email: string;
  tokenHash: string;
  expiresAt: number;
  authSubject?: string | null;
  requestIp?: string | null;
  userAgent?: string | null;
};

type ConsumeTokenResult =
  | { ok: true; email: string; authSubject: string | null }
  | { ok: false; code: "invalid_token" | "expired" | "already_used" };

type FallbackToken = {
  purpose: AuthFlowPurpose;
  email: string;
  authSubject: string | null;
  expiresAt: number;
  consumedAt: number | null;
};

const fallbackTokenStore = new Map<string, FallbackToken>();

function getEmailPurposeKey(email: string, purpose: AuthFlowPurpose) {
  return `${purpose}:${email}`;
}

function clearFallbackEmailPurpose(email: string, purpose: AuthFlowPurpose, now: number) {
  const key = getEmailPurposeKey(email, purpose);
  for (const [tokenHash, token] of fallbackTokenStore) {
    if (getEmailPurposeKey(token.email, token.purpose) !== key) continue;
    if (token.consumedAt !== null) continue;
    fallbackTokenStore.set(tokenHash, {
      ...token,
      consumedAt: now
    });
  }
}

export async function createAuthFlowToken(input: CreateTokenInput) {
  const now = Date.now();
  if (getConvexUrl()) {
    const response = await convexMutation<{ ok: boolean }>(
      anyApi["auth/passwordFlows"].createFlowToken,
      {
        purpose: input.purpose,
        email: input.email,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        authSubject: input.authSubject ?? null,
        requestIp: input.requestIp ?? null,
        userAgent: input.userAgent ?? null
      }
    );

    if (!response.ok) {
      throw new Error(response.error);
    }

    return;
  }

  clearFallbackEmailPurpose(input.email, input.purpose, now);
  fallbackTokenStore.set(input.tokenHash, {
    purpose: input.purpose,
    email: input.email,
    authSubject: input.authSubject ?? null,
    expiresAt: input.expiresAt,
    consumedAt: null
  });
}

export async function consumeAuthFlowToken(
  purpose: AuthFlowPurpose,
  tokenHash: string
): Promise<ConsumeTokenResult> {
  const now = Date.now();

  if (getConvexUrl()) {
    const response = await convexMutation<
      | { ok: true; email: string; authSubject: string | null }
      | { ok: false; code: "invalid_token" | "expired" | "already_used" }
    >(anyApi["auth/passwordFlows"].consumeFlowToken, {
      purpose,
      tokenHash
    });

    if (!response.ok) {
      return { ok: false, code: "invalid_token" };
    }

    return response.data;
  }

  const record = fallbackTokenStore.get(tokenHash);
  if (!record || record.purpose !== purpose) {
    return { ok: false, code: "invalid_token" };
  }

  if (record.consumedAt !== null) {
    return { ok: false, code: "already_used" };
  }

  if (record.expiresAt <= now) {
    fallbackTokenStore.set(tokenHash, {
      ...record,
      consumedAt: now
    });
    return { ok: false, code: "expired" };
  }

  fallbackTokenStore.set(tokenHash, {
    ...record,
    consumedAt: now
  });

  return {
    ok: true,
    email: record.email,
    authSubject: record.authSubject
  };
}

type AuthUserRecord = {
  userId: string;
  email: string | null;
  displayName: string | null;
  emailVerifiedAt: number | null;
};

export async function findAuthUserByEmail(email: string): Promise<AuthUserRecord | null> {
  if (!getConvexUrl()) {
    return null;
  }

  const response = await convexQuery<AuthUserRecord | null>(anyApi.users.getUserByEmail, { email });
  if (!response.ok) {
    return null;
  }
  return response.data;
}

export async function markEmailVerifiedByEmail(email: string) {
  if (!getConvexUrl()) {
    return { ok: false as const };
  }

  const response = await convexMutation<{ ok: boolean; userId?: string }>(
    anyApi.users.markEmailVerifiedByEmail,
    { email }
  );

  if (!response.ok) {
    return { ok: false as const };
  }

  return { ok: Boolean(response.data.ok) };
}

export const __authFlowTestUtils = {
  clearFallbackStore() {
    fallbackTokenStore.clear();
  }
};
