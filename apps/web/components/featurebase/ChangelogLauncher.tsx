"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { trackFeaturebaseChangelogOpened } from "../../lib/analytics/featurebaseEvents";
import {
  getFeaturebaseChangelogUnreadCount,
  getFeaturebasePublicConfig,
  openFeaturebaseChangelog,
  subscribeToFeaturebaseChangelogUnreadCount
} from "../../lib/featurebase/loader";

type Props = {
  context: string;
  className?: string;
  children?: ReactNode;
  badgeClassName?: string;
  storybookId?: string;
  chapterId?: string;
  onClick?: () => void;
  role?: string;
};

export function ChangelogLauncher({
  context,
  className,
  children = "What's new",
  badgeClassName,
  storybookId,
  chapterId,
  onClick,
  role
}: Props) {
  const pathname = usePathname();
  const config = getFeaturebasePublicConfig();
  const [unreadCount, setUnreadCount] = useState(() => getFeaturebaseChangelogUnreadCount());

  useEffect(() => subscribeToFeaturebaseChangelogUnreadCount(setUnreadCount), []);

  if (!config.changelogEnabled) return null;

  return (
    <button
      type="button"
      role={role}
      className={className}
      onClick={() => {
        onClick?.();
        trackFeaturebaseChangelogOpened({
          context,
          route: pathname ?? undefined,
          storybookId,
          chapterId
        });
        void openFeaturebaseChangelog();
      }}
    >
      <span>{children}</span>
      {unreadCount > 0 ? (
        <span aria-label={`${unreadCount} unread updates`} className={badgeClassName}>
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
}
