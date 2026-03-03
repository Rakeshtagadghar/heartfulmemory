export const AUTH_FLOW_COPY = {
  resetRequestSuccess: "If an account exists for this email, we sent reset instructions.",
  verifyRequestSuccess: "If an account exists for this email, we sent a verification email.",
  invalidOrExpiredToken: "This link is invalid or expired. Please request a new one.",
  alreadyUsedToken: "This link has already been used. Please request a new one."
} as const;

export const AUTH_FLOW_TTL_MS = {
  passwordReset: 30 * 60 * 1000,
  emailVerification: 24 * 60 * 60 * 1000
} as const;

export const AUTH_RATE_LIMITS = {
  passwordResetRequest: {
    byIp: { windowMs: 10 * 60 * 1000, max: 10 },
    byEmail: { windowMs: 10 * 60 * 1000, max: 3 }
  },
  emailVerifyRequest: {
    byIp: { windowMs: 10 * 60 * 1000, max: 10 },
    byEmail: { windowMs: 10 * 60 * 1000, max: 3 }
  },
  tokenConsume: {
    byIp: { windowMs: 5 * 60 * 1000, max: 20 }
  }
} as const;