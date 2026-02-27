import { Card } from "./card";
import { ButtonLink } from "./button";

export function ErrorBanner({
  title = "Something went wrong",
  message,
  referenceId,
  retryHref,
  backHref,
  backLabel = "Back"
}: {
  title?: string;
  message: string;
  referenceId?: string | null;
  retryHref?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold text-rose-100">{title}</p>
      <p className="mt-2 text-sm text-rose-100/90">{message}</p>
      {referenceId ? (
        <p className="mt-2 text-xs text-rose-100/70">Error reference: {referenceId}</p>
      ) : null}
      {retryHref || backHref ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {retryHref ? (
            <ButtonLink href={retryHref} variant="secondary" size="sm">
              Retry
            </ButtonLink>
          ) : null}
          {backHref ? (
            <ButtonLink href={backHref} variant="ghost" size="sm">
              {backLabel}
            </ButtonLink>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
