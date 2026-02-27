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
      return <div className="h-0.5 w-10 rounded-full bg-[#8ea6c7]" />;
    }
    if (kind === "grid") {
      return (
        <div className="grid h-10 w-14 grid-cols-3 gap-1 rounded-md border border-white/15 bg-[#131f33] p-1">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={`cell-${index}`}
              className={`rounded-sm ${index % 2 === 0 ? "bg-[#4b7ab6]/80" : "bg-[#345f95]/80"}`}
            />
          ))}
        </div>
      );
    }
    if (kind === "frame") {
      return (
        <div className="relative h-10 w-14 rounded-lg border border-[#8c6d39]/60 bg-gradient-to-br from-[#3a2d17] to-[#4a3a20]">
          <div className="absolute inset-1 rounded-md border border-dashed border-[#d8b777]/55" />
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
    { id: "shapes", title: "Shapes", subtitle: "Rectangle, circle, line", tint: "from-[#5ba5dd]/40 to-[#7f8fd8]/35" },
    { id: "frames", title: "Frames", subtitle: "Photo placeholders", tint: "from-[#c6a164]/42 to-[#8a6f45]/38" },
    { id: "grids", title: "Grids", subtitle: "2-col, 3-col, 2x2 layouts", tint: "from-[#4f8f86]/42 to-[#4680a0]/38" }
  ];

  const recentlyUsedItems = recentlyUsed
    .map((id) =>
      elementsCatalogSections.flatMap((section) => section.items).find((item) => item.id === id) ?? null
    )
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="space-y-4 text-white/90">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-[0_10px_30px_rgba(6,17,40,0.16)]">
        <div className="flex items-center gap-2">
          {isCategoryDetailView ? (
            <button
              type="button"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/12 bg-black/25 text-sm text-white/80 hover:bg-black/35 hover:text-white"
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
              className="h-12 w-full rounded-2xl border border-white/12 bg-black/20 px-4 text-sm text-white outline-none ring-0 placeholder:text-white/45 focus:border-cyan-300/40"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/12 bg-black/25 text-base hover:bg-black/35"
            title="Browse photos"
            onClick={onOpenPhotos}
          >
            <span className="text-xs font-semibold text-white/90">Img</span>
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full border border-white/8 bg-black/20 text-base text-white/30"
            title="Voice search (coming soon)"
            disabled
          >
            <span className="text-xs font-semibold">Mic</span>
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full border border-white/8 bg-black/20 text-base text-white/30"
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
              className="h-9 shrink-0 cursor-pointer rounded-full border border-white/12 bg-black/25 px-3 text-sm text-white/85 hover:bg-black/35"
              onClick={() => handleInsert(chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white/90 hover:bg-black/30"
        onClick={onOpenPhotos}
      >
        <span>Browse Photos</span>
        <span className="text-white/50">-&gt;</span>
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
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2 text-left hover:bg-black/30"
                    onClick={() => handleInsert(item.id)}
                  >
                    <div className="shrink-0 rounded-lg border border-white/10 bg-[#0f1728] p-1">{renderGlyph(item.kind)}</div>
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
                  className="cursor-pointer rounded-2xl border border-white/10 bg-black/20 p-3 text-left hover:bg-black/30"
                  onClick={() => setActiveCategoryId(card.id)}
                >
                  <div className={`h-14 rounded-xl bg-gradient-to-br ${card.tint} p-2`}>
                    <div className="grid h-full grid-cols-3 gap-1 rounded-lg border border-white/25 bg-[#0f1a2f]/35 p-1">
                      {Array.from({ length: 6 }, (_, index) => (
                        <div
                          key={`${card.id}-preview-${index}`}
                          className={`rounded-sm ${index % 2 === 0 ? "bg-[#eaf3ff]/70" : "bg-[#b9d2ec]/50"}`}
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
                  className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-3 text-left"
                >
                  <div className="h-14 rounded-xl bg-black/25" />
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
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2 text-left hover:bg-black/30"
                  onClick={() => handleInsert(item.id)}
                >
                  <div className="shrink-0 rounded-lg border border-white/10 bg-[#0f1728] p-1">{renderGlyph(item.kind)}</div>
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
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/65">
            No matching elements. Try another search.
          </div>
        ) : null}

        {isAllCategoriesView ? null : (
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
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
