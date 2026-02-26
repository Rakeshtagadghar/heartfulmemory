import type { FunctionReference } from "convex/server";
import { createConvexHttpClient } from "./server";

function getClient() {
  return createConvexHttpClient();
}

function ref<T extends "query" | "mutation" | "action">(value: unknown) {
  return value as FunctionReference<T>;
}

export async function convexQuery<TData>(path: unknown, args?: Record<string, unknown>) {
  const client = getClient();
  if (!client) {
    return { ok: false as const, error: "Convex is not configured." };
  }

  try {
    const data = await client.query(ref<"query">(path), (args ?? {}) as never);
    return { ok: true as const, data: data as TData };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Convex query failed."
    };
  }
}

export async function convexMutation<TData>(path: unknown, args?: Record<string, unknown>) {
  const client = getClient();
  if (!client) {
    return { ok: false as const, error: "Convex is not configured." };
  }

  try {
    const data = await client.mutation(ref<"mutation">(path), (args ?? {}) as never);
    return { ok: true as const, data: data as TData };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Convex mutation failed."
    };
  }
}

export async function convexAction<TData>(path: unknown, args?: Record<string, unknown>) {
  const client = getClient();
  if (!client) {
    return { ok: false as const, error: "Convex is not configured." };
  }

  try {
    const data = await client.action(ref<"action">(path), (args ?? {}) as never);
    return { ok: true as const, data: data as TData };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Convex action failed."
    };
  }
}

export { anyApi } from "convex/server";
export { getConvexUrl } from "./server";
