"use client";

import { useEffect } from "react";
import { initializeFeaturebaseForAuthenticatedApp } from "../../lib/featurebase/loader";

export function FeaturebaseProvider() {
  useEffect(() => {
    void initializeFeaturebaseForAuthenticatedApp().catch((error) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[featurebase] failed to initialize", error);
      }
    });
  }, []);

  return null;
}
