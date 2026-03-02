"use client";

/**
 * Sprint 34 – Table of Contents page renderer.
 *
 * Renders a live-preview of the ToC entries inside the Studio canvas.
 * This component receives the computed entries and renders them using
 * the selected template style.
 */

import type { TocEntry, TocSettings } from "../../../../packages/shared/toc/tocTypes";
import { DEFAULT_TOC_SETTINGS } from "../../../../packages/shared/toc/tocTypes";

type TocPageRendererProps = {
    entries: TocEntry[];
    settings?: Partial<TocSettings>;
    pageWidthPx: number;
    pageHeightPx: number;
    margins: { top: number; right: number; bottom: number; left: number };
    isStale?: boolean;
};

const PAGE_NUMBER_COL_MIN_WIDTH = 36;
const PAGE_NUMBER_COL_PADDING_LEFT = 8;

function DotLeaders({ show }: { show: boolean }) {
    if (!show) return null;
    return (
        <span
            className="mx-1 flex-1 overflow-hidden"
            style={{
                backgroundImage: "radial-gradient(circle, currentColor 0.8px, transparent 0.8px)",
                backgroundSize: "6px 100%",
                backgroundRepeat: "repeat-x",
                backgroundPosition: "left center",
                height: "1em",
                opacity: 0.35,
            }}
        />
    );
}

function TocEntryRow({
    entry,
    settings,
}: {
    entry: TocEntry;
    settings: TocSettings;
}) {
    const indent = entry.level * settings.indentPerLevelPx;
    const showDots = settings.dotLeaders && settings.includePageNumbers;

    return (
        <div
            className="flex items-baseline text-[13px] leading-[1.65]"
            style={{ paddingLeft: indent }}
        >
            <span
                className={`shrink-0 ${entry.level === 0 ? "font-semibold text-[#1a1a1a]" : "text-[#444]"}`}
                style={{
                    maxWidth: showDots ? "calc(100% - 60px)" : "100%",
                    overflow: "hidden",
                    textOverflow: settings.wrapMode === "truncate" ? "ellipsis" : undefined,
                    whiteSpace: settings.wrapMode === "truncate" ? "nowrap" : undefined,
                    display: settings.wrapMode === "truncate" ? "inline-block" : undefined,
                    WebkitLineClamp: settings.wrapMode === "wrap" ? settings.maxLinesPerEntry : undefined,
                    WebkitBoxOrient: settings.wrapMode === "wrap" ? "vertical" : undefined,
                }}
            >
                {entry.title}
            </span>

            {showDots && <DotLeaders show />}

            {settings.includePageNumbers && (
                <span
                    className="shrink-0 text-right tabular-nums text-[#666]"
                    style={{
                        minWidth: PAGE_NUMBER_COL_MIN_WIDTH,
                        paddingLeft: PAGE_NUMBER_COL_PADDING_LEFT,
                    }}
                >
                    {entry.computedPageNumber ?? "–"}
                </span>
            )}
        </div>
    );
}

export function TocPageRenderer({
    entries,
    settings: settingsOverride,
    pageWidthPx,
    pageHeightPx,
    margins,
    isStale = false,
}: TocPageRendererProps) {
    const settings: TocSettings = { ...DEFAULT_TOC_SETTINGS, ...settingsOverride };

    const contentWidth = pageWidthPx - margins.left - margins.right;
    const contentHeight = pageHeightPx - margins.top - margins.bottom;

    return (
        <div
            className="relative"
            style={{
                width: pageWidthPx,
                height: pageHeightPx,
                fontFamily: "'Georgia', 'Times New Roman', serif",
            }}
        >
            {/* Safe-area content */}
            <div
                className="absolute overflow-hidden"
                style={{
                    left: margins.left,
                    top: margins.top,
                    width: contentWidth,
                    height: contentHeight,
                }}
            >
                {/* Title */}
                <h2
                    className="mb-4 text-center text-lg font-bold tracking-wide text-[#222]"
                    style={{
                        textTransform: settings.template === "royal" ? "uppercase" : undefined,
                        letterSpacing: settings.template === "royal" ? "0.12em" : "0.04em",
                        borderBottom:
                            settings.template === "classic_dots" || settings.template === "royal"
                                ? "1px solid #ccc"
                                : undefined,
                        paddingBottom: 8,
                    }}
                >
                    {settings.title}
                </h2>

                {/* Entries */}
                <div className="space-y-0.5">
                    {entries.length === 0 ? (
                        <p className="text-center text-sm italic text-[#999]">
                            No entries yet – add chapter or page to populate.
                        </p>
                    ) : (
                        entries.map((entry) => (
                            <TocEntryRow key={entry.sourcePageId} entry={entry} settings={settings} />
                        ))
                    )}
                </div>
            </div>

            {/* Stale indicator overlay */}
            {isStale && (
                <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-1">
                    <div className="rounded-b-md bg-amber-500/90 px-3 py-0.5 text-[10px] font-semibold text-white shadow">
                        ToC needs refresh
                    </div>
                </div>
            )}
        </div>
    );
}
