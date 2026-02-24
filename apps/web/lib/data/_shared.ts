export type DataResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export function dataError(error: unknown, fallback: string): DataResult<never> {
  if (error && typeof error === "object" && "message" in error) {
    return {
      ok: false,
      error: String((error as { message?: unknown }).message || fallback),
      code: typeof (error as { code?: unknown }).code === "string" ? (error as { code?: string }).code : undefined
    };
  }

  return { ok: false, error: fallback };
}
