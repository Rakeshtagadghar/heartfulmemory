"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ConvexProvider } from "convex/react";
import { getConvexPublicUrl } from "../lib/convex/env";
import { getConvexReactClient } from "../lib/convex/client";

export function Providers({ children }: { children: ReactNode }) {
  const convexUrl = getConvexPublicUrl();
  const convexClient = convexUrl ? getConvexReactClient(convexUrl) : null;

  return (
    <SessionProvider>
      {convexClient ? (
        <ConvexProvider client={convexClient}>{children}</ConvexProvider>
      ) : (
        children
      )}
    </SessionProvider>
  );
}
