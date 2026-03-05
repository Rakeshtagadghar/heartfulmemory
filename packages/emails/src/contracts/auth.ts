import { z } from "zod";

const optionalUserName = z.string().trim().min(1).max(80).optional();
const optionalLogoUrl = z.string().url().optional();

export const verifyEmailVarsSchema = z.object({
  userName: optionalUserName,
  verifyUrl: z.string().url(),
  expiryMinutes: z.number().int().positive().max(60 * 24 * 7),
  supportUrl: z.string().url(),
  appName: z.string().trim().min(1).max(80).optional(),
  logoUrl: optionalLogoUrl
});

export const loginLinkOrCodeVarsSchema = z.object({
  userName: optionalUserName,
  loginUrl: z.string().url(),
  code: z
    .string()
    .trim()
    .regex(/^[A-Z0-9-]{4,12}$/i)
    .optional(),
  expiryMinutes: z.number().int().positive().max(60 * 24),
  supportUrl: z.string().url(),
  appName: z.string().trim().min(1).max(80).optional(),
  logoUrl: optionalLogoUrl
});

export const resetPasswordVarsSchema = z.object({
  userName: optionalUserName,
  resetUrl: z.string().url(),
  expiryMinutes: z.number().int().positive().max(60 * 24),
  supportUrl: z.string().url(),
  appName: z.string().trim().min(1).max(80).optional(),
  logoUrl: optionalLogoUrl
});

export const passwordSetSuccessVarsSchema = z.object({
  userName: optionalUserName,
  securityUrl: z.string().url(),
  supportUrl: z.string().url(),
  appName: z.string().trim().min(1).max(80).optional(),
  logoUrl: optionalLogoUrl
});

export type VerifyEmailVars = z.infer<typeof verifyEmailVarsSchema>;
export type LoginLinkOrCodeVars = z.infer<typeof loginLinkOrCodeVarsSchema>;
export type ResetPasswordVars = z.infer<typeof resetPasswordVarsSchema>;
export type PasswordSetSuccessVars = z.infer<typeof passwordSetSuccessVarsSchema>;

export const authTemplateIdSchema = z.enum([
  "verify_email",
  "login_code_or_magic_link",
  "reset_password",
  "password_set_success"
]);

export type AuthTemplateId = z.infer<typeof authTemplateIdSchema>;
