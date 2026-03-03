const MIN_PASSWORD_LENGTH = 8;

type PasswordValidationResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      code: "too_short" | "missing_number" | "missing_letter";
    };

export function validatePasswordStrength(password: string): PasswordValidationResult {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      code: "too_short",
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    };
  }

  if (!/[A-Za-z]/.test(password)) {
    return {
      ok: false,
      code: "missing_letter",
      message: "Password must include at least one letter."
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      ok: false,
      code: "missing_number",
      message: "Password must include at least one number."
    };
  }

  return { ok: true };
}