"use client";

import { Button } from "../ui/button";

export function ExportButtonCrown({
  premiumLocked,
  disabled,
  onClick
}: {
  premiumLocked: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={premiumLocked ? "secondary" : "primary"}
      disabled={disabled}
      leftIcon={
        premiumLocked ? (
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 18h18" />
            <path d="m5 18 2-10 5 4 5-4 2 10" />
            <path d="M7 8 12 4l5 4" />
          </svg>
        ) : undefined
      }
      onClick={onClick}
    >
      {premiumLocked ? "Upgrade to Export" : "Export"}
    </Button>
  );
}
