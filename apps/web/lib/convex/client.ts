"use client";

import { ConvexReactClient } from "convex/react";

let client: ConvexReactClient | null = null;

export function getConvexReactClient(url: string) {
  if (!client) {
    client = new ConvexReactClient(url);
  }
  return client;
}
