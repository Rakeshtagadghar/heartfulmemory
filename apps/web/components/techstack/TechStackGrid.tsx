"use client";

import { useState } from "react";
import type { TechStackItem, TechStackStatus } from "../../types/techStack";
import { TECH_STACK_CATEGORIES } from "../../content/techStack";
import { TechStackItemCard } from "./TechStackItemCard";

type FilterStatus = TechStackStatus | "all";

const FILTER_OPTIONS: { label: string; value: FilterStatus }[] = [
  { label: "All", value: "all" },
  { label: "Core", value: "core" },
  { label: "Optional", value: "optional" },
  { label: "Planned", value: "planned" }
];

export function TechStackGrid({ items }: { items: TechStackItem[] }) {
  const [filter, setFilter] = useState<FilterStatus>("all");

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);

  const grouped = TECH_STACK_CATEGORIES.map((cat) => ({
    category: cat,
    items: filtered.filter((i) => i.category === cat)
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            aria-pressed={filter === opt.value}
            className={`rounded-full border px-4 py-1.5 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold ${
              filter === opt.value
                ? "border-gold/50 bg-gold/15 text-gold"
                : "border-white/15 bg-white/5 text-white/60 hover:border-white/25 hover:text-white/80"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Category sections */}
      <div className="mt-10 space-y-14">
        {grouped.map(({ category, items: catItems }) => (
          <section key={category} aria-labelledby={`cat-${category.replace(/\W/g, "-")}`}>
            <h2
              id={`cat-${category.replace(/\W/g, "-")}`}
              className="mb-6 font-display text-2xl text-parchment"
            >
              {category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {catItems.map((item) => (
                <TechStackItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
