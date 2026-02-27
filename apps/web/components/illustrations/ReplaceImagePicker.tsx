import Image from "next/image";
import { Card } from "../ui/card";
import { TrackedIllustrationActionButton } from "./TrackedIllustrationActionButton";
import { UploadImagePicker } from "./UploadImagePicker";
import type { ProviderAssetCandidate } from "../../lib/data/create-flow";

type ActionResult = { ok: true } | { ok: false; error: string };

export function ReplaceImagePicker({
  storybookId,
  slotId,
  query,
  provider,
  results,
  uploadedAssets,
  minShortSidePx,
  orientation,
  searchActionUrl,
  onReplace,
  onUploadAndReplace,
  onUseUploadedAsset
}: {
  storybookId: string;
  slotId: string;
  query: string;
  provider: "unsplash" | "pexels" | "both";
  results: ProviderAssetCandidate[];
  uploadedAssets: Array<{
    id: string;
    cachedUrl: string;
    thumbUrl: string | null;
    width: number;
    height: number;
  }>;
  minShortSidePx: number;
  orientation: "landscape" | "portrait" | "square";
  searchActionUrl: string;
  onReplace: (formData: FormData) => Promise<void>;
  onUploadAndReplace: (input: {
    slotId: string;
    sourceUrl: string;
    storageKey: string | null;
    mimeType: string;
    width: number | null;
    height: number | null;
    sizeBytes: number;
    fileName: string;
  }) => Promise<ActionResult>;
  onUseUploadedAsset: (input: { slotId: string; mediaAssetId: string }) => Promise<ActionResult>;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-sm font-semibold text-parchment">Replace Image: {slotId}</p>
      <p className="mt-1 text-xs text-white/55">
        Search stock photos and replace this slot. Results are filtered for {orientation} and min short side{" "}
        {minShortSidePx}px.
      </p>

      <form action={searchActionUrl} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <input type="hidden" name="replaceSlot" value={slotId} />
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search image theme..."
          className="h-10 rounded-xl border border-white/15 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-gold/45"
        />
        <select
          name="provider"
          defaultValue={provider}
          className="h-10 rounded-xl border border-white/15 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-gold/45"
        >
          <option value="both" className="bg-[#0f1116] text-white">Both</option>
          <option value="unsplash" className="bg-[#0f1116] text-white">Unsplash</option>
          <option value="pexels" className="bg-[#0f1116] text-white">Pexels</option>
        </select>
        <TrackedIllustrationActionButton type="submit" variant="secondary" eventName={undefined}>
          Search
        </TrackedIllustrationActionButton>
        <a
          href={searchActionUrl.split("?")[0]}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-semibold text-white/60 hover:bg-white/[0.03]"
        >
          Close
        </a>
      </form>

      <UploadImagePicker
        storybookId={storybookId}
        slotId={slotId}
        uploadedAssets={uploadedAssets}
        onUploadAndReplace={onUploadAndReplace}
        onUseUploadedAsset={onUseUploadedAsset}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/55">
            No results yet. Search to load candidate images.
          </div>
        ) : (
          results.map((result) => (
            <div key={`${result.provider}:${result.id}`} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
              <Image
                src={result.thumbUrl}
                alt={result.query ?? "Candidate"}
                width={Math.max(1, result.width || 1200)}
                height={Math.max(1, result.height || 800)}
                unoptimized
                className="h-36 w-full object-cover"
              />
              <div className="p-3">
                <p className="text-xs text-white/60">{result.provider}</p>
                <p className="mt-1 text-xs text-white/50">{result.width} x {result.height}</p>
                <p className="mt-1 line-clamp-2 text-xs text-white/60">{result.attributionText}</p>
                <form action={onReplace} className="mt-3">
                  <input type="hidden" name="slotId" value={slotId} />
                  <input type="hidden" name="candidateJson" value={JSON.stringify(result)} />
                  <TrackedIllustrationActionButton
                    type="submit"
                    size="sm"
                    eventName="illustration_replace"
                    eventProps={{ slotId, provider: result.provider }}
                  >
                    Use This Image
                  </TrackedIllustrationActionButton>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
