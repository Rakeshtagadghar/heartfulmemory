"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getFeaturebasePublicConfig, openFeaturebaseFeedback } from "../../lib/featurebase/loader";

type Props = {
  context: string;
  className?: string;
  children?: ReactNode;
  storybookId?: string;
  chapterId?: string;
  board?: string | null;
  onClick?: () => void;
  role?: string;
};

export function FeedbackLauncher({
  context,
  className,
  children = "Send feedback",
  storybookId,
  chapterId,
  board,
  onClick,
  role
}: Props) {
  const pathname = usePathname();
  const config = getFeaturebasePublicConfig();

  if (!config.feedbackEnabled) return null;

  return (
    <button
      type="button"
      role={role}
      className={className}
      onClick={() => {
        onClick?.();
        void openFeaturebaseFeedback(
          {
            context,
            route: pathname ?? undefined,
            storybookId,
            chapterId
          },
          board ?? config.feedbackDefaultBoard
        );
      }}
    >
      {children}
    </button>
  );
}
