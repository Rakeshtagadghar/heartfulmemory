export type PasswordSetErrorCode =
  | "ALREADY_HAS_PASSWORD"
  | "USER_NOT_FOUND"
  | "RATE_LIMITED"
  | "INVALID_PASSWORD"
  | "CONVEX_ERROR"
  | "UNKNOWN";

export function getPasswordSetErrorMessage(code: PasswordSetErrorCode) {
  if (code === "ALREADY_HAS_PASSWORD") {
    return "This account already has a password. Use reset password if needed.";
  }
  if (code === "USER_NOT_FOUND") {
    return "Could not find your account. Please sign out and sign in again.";
  }
  if (code === "RATE_LIMITED") {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (code === "INVALID_PASSWORD") {
    return "Use a stronger password with at least 8 characters, one letter, and one number.";
  }
  if (code === "CONVEX_ERROR") {
    return "Could not update password right now. Please try again.";
  }
  return "Could not set password right now. Please try again.";
}

