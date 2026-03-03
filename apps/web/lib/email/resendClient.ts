import { sendEmail, type TransactionalEmailInput } from "./sender";

export { type TransactionalEmailInput };

export async function sendTransactionalEmail(input: TransactionalEmailInput) {
  const result = await sendEmail(input);
  if (result.ok) {
    return { ok: true as const, id: result.id };
  }

  return {
    ok: false as const,
    skipped: Boolean(result.skipped),
    error: result.error,
    code: result.code
  };
}