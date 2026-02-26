"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "../ui/button";

export function ProceedNextChapterButton({
  href,
  label = "Proceed to Next Chapter",
  disabled = false
}: {
  href: string;
  label?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={disabled}
      loading={isPending}
      onClick={() => {
        if (disabled) return;
        startTransition(() => {
          router.push(href);
        });
      }}
    >
      {isPending ? "Opening..." : label}
    </Button>
  );
}
