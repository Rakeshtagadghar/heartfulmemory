"use client";

import { useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { captureAppError } from "../../../../lib/observability/capture";

export default function AppRouteError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureAppError(error, {
      runtime: "client",
      flow: "app_route_error",
      feature: "app_shell",
      route: "/app",
      code: error.digest,
      extra: {
        digest: error.digest ?? null
      }
    });
  }, [error]);

  return (
    <Card className="p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-rose-200/80">App Error</p>
      <h1 className="mt-2 font-display text-3xl text-parchment">Something went wrong</h1>
      <p className="mt-3 text-sm leading-7 text-rose-100">
        {error.message || "Unable to load the workspace."}
      </p>
      <div className="mt-4">
        <Button type="button" variant="secondary" onClick={reset}>
          Retry
        </Button>
      </div>
    </Card>
  );
}
