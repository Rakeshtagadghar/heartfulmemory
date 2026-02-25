"use client";

import { useMemo, useState } from "react";
import {
  elementsCatalogSections,
  elementsQuickChips,
  type ElementsCatalogItemId
} from "./elementsCatalog";

export function ElementsPanel({
  onInsertElement,
  onOpenPhotos
}: {
  onInsertElement: (id: ElementsCatalogItemId) => void;
  onOpenPhotos: () => void;
}) {
  type ElementsCategoryId = "all" | "shapes" | "frames" | "grids";
  const [query, setQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<ElementsCategoryId>("all");
  const [recentlyUsed, setRecentlyUsed] = useState<ElementsCatalogItemId[]>(["rect", "frame"]);
  const isAllCategoriesView = activeCategoryId === "all";
  const isCategoryDetailView = activeCategoryId !== "all";

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const baseSections =
      isAllCategoriesView
        ? elementsCatalogSections
        : elementsCatalogSections.filter((section) => section.id === activeCategoryId);
    if (!q) return baseSections;
    return baseSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.hint.toLowerCase().includes(q) ||
            section.label.toLowerCase().includes(q)
        )
      }))
      .filter((section) => section.items.length > 0);
  }, [activeCategoryId, isAllCategoriesView, query]);

  function handleInsert(id: ElementsCatalogItemId) {
    onInsertElement(id);
    setRecentlyUsed((current) => {
      const next = [id, ...current.filter((value) => value !== id)];
      return next.slice(0, 6);
    });
  }

  function renderGlyph(kind: string) {
    if (kind === "line") {
      return <div className="h-0.5 w-10 rounded-full bg-slate-900" />;
    }
    if (kind === "grid") {
      return (
        <div className="grid h-10 w-14 grid-cols-3 gap-1 rounded-md border border-[#d9dce6] bg-white p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)]">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={`cell-${index}`} className="rounded-sm bg-[#c8f1f3]" />
          ))}
        </div>
      );
    }
    if (kind === "frame") {
      return (
        <div className="relative h-10 w-14 rounded-lg border border-[#ecd7a8] bg-gradient-to-br from-[#f6edd8] to-[#fff8e9]">
          <div className="absolute inset-1 rounded-md border border-dashed border-[#b89b58]/60" />
        </div>
      );
    }
    return (
      <div className="flex h-10 w-14 items-center justify-center">
        <div className="h-8 w-10 rounded-md bg-[#171c2b]" />
      </div>
    );
  }

  const categoryCards: Array<{
    id: "shapes" | "frames" | "grids";
    title: string;
    subtitle: string;
    tint: string;
  }> = [
    { id: "shapes", title: "Shapes", subtitle: "Rectangle, circle, line", tint: "from-cyan-200 to-blue-200" },
    { id: "frames", title: "Frames", subtitle: "Photo placeholders", tint: "from-amber-200 to-yellow-200" },
    { id: "grids", title: "Grids", subtitle: "2-col, 3-col, 2x2 layouts", tint: "from-emerald-200 to-teal-200" }
  ];

  const recentlyUsedItems = recentlyUsed
    .map((id) =>
      elementsCatalogSections.flatMap((section) => section.items).find((item) => item.id === id) ?? null
    )
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="space-y-4 text-[#161b28]">
      <div className="rounded-2xl border border-[#e5ddff] bg-white p-4 shadow-[0_10px_30px_rgba(6,17,40,0.06)]">
        <div className="flex items-center gap-2">
          {isCategoryDetailView ? (
            <button
              type="button"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#d9dce6] bg-white text-sm hover:bg-[#f7f8fc]"
              onClick={() => setActiveCategoryId("all")}
              aria-label="Back to all elements"
              title="Back"
            >
              ←
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <label htmlFor="elements-search" className="sr-only">
              Search elements
            </label>
            <input
              id="elements-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search elements"
              className="h-12 w-full rounded-2xl border border-[#eadcff] bg-[#fdfcff] px-4 text-sm text-[#161b28] outline-none ring-0 placeholder:text-[#8a90a6] focus:border-[#cdb7ff]"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#d9dce6] bg-white text-base hover:bg-[#f7f8fc]"
            title="Browse photos"
            onClick={onOpenPhotos}
          >
            <span className="text-xs font-semibold text-[#2b3143]">Img</span>
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full border border-[#eceff7] bg-[#f7f8fc] text-base text-[#adb3c6]"
            title="Voice search (coming soon)"
            disabled
          >
            <span className="text-xs font-semibold">Mic</span>
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full border border-[#eceff7] bg-[#f7f8fc] text-base text-[#adb3c6]"
            title="Generate (coming soon)"
            disabled
          >
            <span className="text-sm">Go</span>
          </button>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {elementsQuickChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className="h-9 shrink-0 cursor-pointer rounded-full border border-[#e2d3ff] bg-white px-3 text-sm text-[#2b3143] hover:bg-[#f9f5ff]"
              onClick={() => handleInsert(chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-[#d9dce6] bg-white px-3 text-sm font-semibold text-[#1f2433] hover:bg-[#fafbff]"
        onClick={onOpenPhotos}
      >
        <span>Browse Photos</span>
        <span className="text-[#8a90a6]">→</span>
      </button>

      {isAllCategoriesView ? (
        <>
          {recentlyUsedItems.length > 0 ? (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white/90">Recently used</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {recentlyUsedItems.map((item) => (
                  <button
                    key={`recent-${item.id}`}
                    type="button"
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-2 text-left hover:bg-white/[0.07]"
                    onClick={() => handleInsert(item.id)}
                  >
                    <div className="shrink-0 rounded-lg border border-white/10 bg-white p-1">{renderGlyph(item.kind)}</div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white/90">{item.label}</p>
                      <p className="truncate text-xs text-white/55">{item.hint}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white/90">Browse categories</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {categoryCards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className="cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left hover:bg-white/[0.06]"
                  onClick={() => setActiveCategoryId(card.id)}
                >
                  <div className={`h-14 rounded-xl bg-gradient-to-br ${card.tint} p-2`}>
                    <div className="grid h-full grid-cols-3 gap-1 rounded-lg border border-white/50 bg-white/45 p-1">
                      {Array.from({ length: 6 }, (_, index) => (
                        <div
                          key={`${card.id}-preview-${index}`}
                          className={`rounded-sm ${index % 2 === 0 ? "bg-white/80" : "bg-white/50"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white/95">{card.title}</p>
                  <p className="mt-0.5 text-xs leading-4 text-white/60">{card.subtitle}</p>
                </button>
              ))}

              {["Charts", "Tables", "Frames+", "Mockups"].map((label) => (
                <div
                  key={label}
                  className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-3 text-left"
                >
                  <div className="h-14 rounded-xl bg-white/[0.03]" />
                  <p className="mt-2 text-sm font-semibold text-white/75">{label}</p>
                  <p className="mt-0.5 text-xs text-white/45">Coming later</p>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}

      <div className="space-y-4">
        {filteredSections.map((section) => (
          <section key={section.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white/90">{section.label}</p>
              <button
                type="button"
                className="cursor-pointer text-xs text-white/55 hover:text-white/80"
                onClick={() => {
                  const first = section.items[0];
                  if (first) handleInsert(first.id);
                }}
              >
                Quick add
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-2 text-left hover:bg-white/[0.05]"
                  onClick={() => handleInsert(item.id)}
                >
                  <div className="shrink-0 rounded-lg border border-white/10 bg-white/95 p-1">{renderGlyph(item.kind)}</div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white/90">{item.label}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-white/55">{item.hint}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
        {filteredSections.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-white/65">
            No matching elements. Try another search.
          </div>
        ) : null}

        {isAllCategoriesView ? null : (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-white/45">Tip</p>
            <p className="mt-2 text-sm text-white/75">
              Insert an element, then use the right-side Properties panel to style fill, stroke, radius, and sizing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
