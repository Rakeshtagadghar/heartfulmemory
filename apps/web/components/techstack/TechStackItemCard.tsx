import Image from "next/image";
import type { TechStackItem } from "../../types/techStack";

export function TechStackItemCard({ item }: { item: TechStackItem }) {
  return (
    <article className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-5 shadow-panel transition hover:border-white/20 hover:bg-white/[0.05]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2">
          <Image
            src={`/tech/${item.iconKey}.svg`}
            alt={`${item.name} logo`}
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/tech/fallback.svg";
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg text-parchment">{item.name}</h3>
            {item.status === "planned" && (
              <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-xs text-gold">
                Planned
              </span>
            )}
            {item.status === "optional" && (
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-white/50">
                Optional
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-white/55">{item.role}</p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-white/70">{item.why}</p>

      <div className="mt-auto flex flex-wrap items-center gap-2">
        <a
          href={item.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/65 transition hover:border-white/20 hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
        >
          Site ↗
        </a>
        {item.docsUrl !== item.websiteUrl && (
          <a
            href={item.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/65 transition hover:border-white/20 hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
          >
            Docs ↗
          </a>
        )}
      </div>
    </article>
  );
}
