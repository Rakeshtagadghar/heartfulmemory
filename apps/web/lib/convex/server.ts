import { ConvexHttpClient } from "convex/browser";

export function getConvexUrl() {
  return process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || null;
}

export function isConvexConfigured() {
  return Boolean(getConvexUrl());
}

export function getConvexDeployKey() {
  return process.env.CONVEX_DEPLOY_KEY || null;
}

export function createConvexHttpClient() {
  const url = getConvexUrl();
  if (!url) return null;
  return new ConvexHttpClient(url);
}
