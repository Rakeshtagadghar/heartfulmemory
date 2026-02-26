import { Card } from "../ui/card";
import { TrackedIllustrationActionButton } from "./TrackedIllustrationActionButton";

type SlotTarget = {
  slotId: string;
  aspectTarget: number;
  orientation: "landscape" | "portrait" | "square";
  minShortSidePx: number;
};

type SlotFilled = {
  mediaAssetId: string;
  cachedUrl: string;
  thumbUrl: string | null;
  width: number;
  height: number;
  attribution: Record<string, unknown>;
  providerMetaSnapshot: Record<string, unknown>;
};

export function SlotCard({
  slot,
  filled,
  isLocked,
  onToggleLock,
  replaceHref,
  analytics
}: {
  slot: SlotTarget;
  filled?: SlotFilled | null;
  isLocked: boolean;
  onToggleLock: (formData: FormData) => Promise<void>;
  replaceHref: string;
  analytics: {
    chapterKey: string;
    slotId: string;
  };
}) {
  const provider = String(filled?.providerMetaSnapshot?.provider ?? "none");
  const attribution = (filled?.attribution ?? {}) as Record<string, unknown>;
  const authorName = typeof attribution.authorName === "string" ? attribution.authorName : "Unknown";
  const attributionText =
    typeof attribution.attributionText === "string" ? attribution.attributionText : null;

  return (
    <Card className="overflow-hidden p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-parchment">{slot.slotId}</p>
          <p className="mt-1 text-xs text-white/55">
            {slot.orientation} / target AR {slot.aspectTarget.toFixed(2)} / min short side {slot.minShortSidePx}px
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.02] px-2 py-1 text-xs text-white/65">
            {provider}
          </span>
          {isLocked ? (
            <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-1 text-xs text-amber-100">
              Locked
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
        {filled?.cachedUrl ? (
          <img
            src={filled.thumbUrl ?? filled.cachedUrl}
            alt={`${slot.slotId} preview`}
            className="h-52 w-full object-cover"
          />
        ) : (
          <div className="flex h-52 items-center justify-center text-sm text-white/45">
            No image selected yet
          </div>
        )}
      </div>

      {filled ? (
        <div className="mt-3 space-y-1">
          <p className="text-xs text-white/60">
            {filled.width} x {filled.height}
          </p>
          <p className="text-xs text-white/60">Author: {authorName}</p>
          {attributionText ? <p className="text-xs text-white/50">{attributionText}</p> : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <form action={onToggleLock}>
          <input type="hidden" name="slotId" value={slot.slotId} />
          <TrackedIllustrationActionButton
            type="submit"
            variant="secondary"
            size="sm"
            eventName="illustration_lock_toggle"
            eventProps={{ slotId: analytics.slotId, chapterKey: analytics.chapterKey, locked_next: !isLocked }}
          >
            {isLocked ? "Unlock" : "Lock"}
          </TrackedIllustrationActionButton>
        </form>

        <a
          href={replaceHref}
          className="inline-flex h-9 items-center justify-center rounded-xl border border-white/15 px-3 text-sm font-semibold text-white/75 hover:bg-white/[0.03]"
        >
          Replace
        </a>
      </div>
    </Card>
  );
}

