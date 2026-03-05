export const AUTH_FLOW_COPY = {
  resetRequestSuccess: "If an account exists for this email, we sent reset instructions.",
  verifyRequestSuccess: "If an account exists for this email, we sent a verification email.",
  signInLinkRequestSuccess: "If this email can receive sign-in links, we sent one now.",
  invalidOrExpiredToken: "This link is invalid or expired. Please request a new one.",
  alreadyUsedToken: "This link has already been used. Please request a new one."
} as const;

export const AUTH_FLOW_TTL_MS = {
  passwordReset: 30 * 60 * 1000,
  emailVerification: 24 * 60 * 60 * 1000,
  emailSignIn: 20 * 60 * 1000
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
  emailSignInRequest: {
    byIp: { windowMs: 10 * 60 * 1000, max: 12 },
    byEmail: { windowMs: 10 * 60 * 1000, max: 5 }
  },
  tokenConsume: {
    byIp: { windowMs: 5 * 60 * 1000, max: 20 }
  },
  setPasswordAttempt: {
    byIp: { windowMs: 10 * 60 * 1000, max: 10 },
    byUser: { windowMs: 10 * 60 * 1000, max: 6 }
  }
} as const;
