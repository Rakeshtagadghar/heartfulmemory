import Image from "next/image";
import { Card } from "../ui/card";

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjMGExMzIxIi8+PC9zdmc+";

export type MediaMockItem = {
  src: string;
  alt: string;
  width: number;
  height: number;
  title?: string;
  subtitle?: string;
  rotate?: string;
  className?: string;
};

export function MediaMock({
  items
}: {
  items: readonly MediaMockItem[];
}) {
  if (!items.length) return null;

  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_55%_40%,rgba(213,179,106,0.1),transparent_65%)]" />
      <div className="relative aspect-[1.08/0.95] rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-4 shadow-glow backdrop-blur-xl">
        <div className="grid h-full grid-cols-12 grid-rows-12 gap-3">
          {items.map((item, index) => (
            <Card
              key={`${item.src}-${index}`}
              className={`overflow-hidden border-white/12 bg-[#0c1729]/80 p-0 backdrop-blur-md ${
                index === 0
                  ? "col-span-8 row-span-8"
                  : index === 1
                    ? "col-span-4 row-span-6"
                    : "col-span-5 row-span-5"
              } ${index === 1 ? "col-start-9 row-start-2" : ""} ${
                index === 2 ? "col-start-2 row-start-8" : ""
              } ${item.className ?? ""}`}
              style={item.rotate ? { transform: `rotate(${item.rotate})` } : undefined}
            >
              <div className="relative h-full w-full">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 1024px) 90vw, 520px"
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                {item.title ? (
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-gold/90">
                      {item.title}
                    </p>
                    {item.subtitle ? (
                      <p className="mt-1 text-xs text-white/75">{item.subtitle}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

