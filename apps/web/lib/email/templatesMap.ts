export const EMAIL_TEMPLATES = {
  auth: {
    verifyEmail: "verify_email",
    loginLinkOrCode: "login_code_or_magic_link",
    resetPassword: "reset_password",
    passwordSetSuccess: "password_set_success"
  },
  billing: {
    subscriptionActive: "subscription_active",
    paymentFailed: "payment_failed"
  }
} as const;

export type AuthEmailTemplateId = (typeof EMAIL_TEMPLATES.auth)[keyof typeof EMAIL_TEMPLATES.auth];
export type BillingEmailTemplateId = (typeof EMAIL_TEMPLATES.billing)[keyof typeof EMAIL_TEMPLATES.billing];

