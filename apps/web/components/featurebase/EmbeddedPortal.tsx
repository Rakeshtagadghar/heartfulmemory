"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  portalUrl: string | null;
};

export function EmbeddedPortal({ portalUrl }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!portalUrl) return;
    const timeout = window.setTimeout(() => {
      setTimedOut(true);
    }, 8000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [portalUrl]);

  if (!portalUrl) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
        Featurebase portal URL is not configured yet. Set `NEXT_PUBLIC_FEATUREBASE_PORTAL_URL` to enable the embedded
        roadmap and feedback view.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
        <span>{loaded ? "Portal loaded" : "Loading embedded portal..."}</span>
        <Link
          href={portalUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center rounded-full border border-white/15 bg-white/[0.04] px-4 font-semibold text-white transition hover:bg-white/[0.08]"
        >
          Open in new tab
        </Link>
      </div>
      {timedOut && !loaded ? (
        <div className="rounded-2xl border border-gold/20 bg-gold/10 px-4 py-3 text-sm text-gold">
          The embed may be blocked by browser or portal settings. Use the fallback link above if it does not appear.
        </div>
      ) : null}
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#09111d] shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
        <iframe
          title="Featurebase feedback portal"
          src={portalUrl}
          className="h-[78vh] min-h-[720px] w-full bg-[#09111d]"
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}
