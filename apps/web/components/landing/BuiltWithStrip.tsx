import Image from "next/image";
import Link from "next/link";
import { techStackItems, BUILT_WITH_STRIP_IDS } from "../../content/techStack";

const stripItems = BUILT_WITH_STRIP_IDS.map((id) => techStackItems.find((i) => i.id === id)).filter(
  Boolean
) as typeof techStackItems;

export function BuiltWithStrip() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-10 sm:px-8">
      <Link
        href="/tech-stack"
        className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-4 transition hover:border-white/15 hover:bg-white/[0.04]"
        aria-label="View full tech stack"
      >
        <span className="text-xs text-white/40">Built with</span>
        <div className="flex flex-wrap items-center gap-3">
          {stripItems.map((item) => (
            <span
              key={item.id}
              className="flex items-center gap-1.5 text-sm text-white/60"
              title={item.name}
            >
              <Image
                src={`/tech/${item.iconKey}.svg`}
                alt={item.name}
                width={18}
                height={18}
                className="h-[18px] w-[18px] object-contain opacity-80"
              />
              <span className="hidden sm:inline">{item.name}</span>
            </span>
          ))}
        </div>
        <span className="ml-auto text-xs text-white/30 transition group-hover:text-white/50">
          See full stack →
        </span>
      </Link>
    </div>
  );
}
