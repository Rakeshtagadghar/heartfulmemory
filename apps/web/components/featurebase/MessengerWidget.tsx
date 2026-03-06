"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  closeFeaturebaseMessenger,
  getFeaturebasePublicConfig,
  getFeaturebaseMessengerVisible,
  openFeaturebaseMessenger,
} from "../../lib/featurebase/loader";
import { subscribeToFeaturebaseMessengerVisibility } from "../../lib/featurebase/loader";
import { getFeaturebaseMessengerPositionClasses } from "../../lib/featurebase/studioSafePositioning";

type Props = {
  context: string;
  isStudio?: boolean;
  storybookId?: string;
  chapterId?: string;
};

export function MessengerWidget({
  context,
  isStudio = false,
  storybookId,
  chapterId,
}: Props) {
  const pathname = usePathname();
  const config = getFeaturebasePublicConfig();
  const [isOpen, setIsOpen] = useState(() => getFeaturebaseMessengerVisible());

  useEffect(() => {
    return subscribeToFeaturebaseMessengerVisibility(setIsOpen);
  }, []);

  if (!config.messengerEnabled) return null;

  return (
    <div
      className={`fixed z-30 ${getFeaturebaseMessengerPositionClasses(isStudio)}`}
    >
      <button
        type="button"
        aria-label={isOpen ? "Close help messenger" : "Open help messenger"}
        aria-pressed={isOpen}
        className="inline-flex cursor-pointer h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_35%_30%,#8f7bff_0%,#7b68ff_28%,#6758ff_55%,#5746f6_100%)] text-white shadow-[0_18px_42px_rgba(32,24,91,0.46)] transition hover:scale-[1.03] hover:shadow-[0_22px_48px_rgba(32,24,91,0.55)]"
        onClick={() => {
          if (isOpen) {
            void closeFeaturebaseMessenger();
            return;
          }

          void openFeaturebaseMessenger({
            context,
            route: pathname ?? undefined,
            storybookId,
            chapterId,
          });
        }}
      >
        {isOpen ? <MessengerCollapseIcon /> : <MessengerDockIcon />}
      </button>
    </div>
  );
}

function MessengerDockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="cursor-pointer fill-none">
      <path
        d="M12 4.5c-4.694 0-8.5 3.263-8.5 7.288 0 2.32 1.267 4.386 3.241 5.72L6 20.5l3.442-1.786c.817.19 1.674.289 2.558.289 4.694 0 8.5-3.263 8.5-7.215C20.5 7.763 16.694 4.5 12 4.5Z"
        className="fill-white"
        opacity="0.96"
      />
      <path
        d="M12.8 8.2c-2.947 0-5.337 2.053-5.337 4.584 0 1.456.795 2.753 2.032 3.59l-.466 1.879 2.158-1.121c.512.119 1.049.181 1.613.181 2.947 0 5.337-2.053 5.337-4.529 0-2.531-2.39-4.584-5.337-4.584Z"
        className="fill-[#6f5cff]"
      />
      <circle cx="14.25" cy="12.75" r="0.9" className="fill-white" />
      <circle cx="11.75" cy="12.75" r="0.9" className="fill-white" />
    </svg>
  );
}

function MessengerCollapseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6 cursor-pointer fill-none stroke-white stroke-[2.6]"
    >
      <path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
