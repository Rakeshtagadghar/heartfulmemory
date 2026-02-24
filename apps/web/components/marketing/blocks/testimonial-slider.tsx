"use client";

import { useId, useState } from "react";
import type { TestimonialsBlock } from "../../../content/landing.schema";
import { ViewportEvent } from "../../viewport-event";
import { Card } from "../../ui/card";
import { buttonClassName } from "../../ui/button";
import { cn } from "../../ui/cn";

export function TestimonialSlider({ block }: { block: TestimonialsBlock }) {
  const [index, setIndex] = useState(0);
  const regionId = useId();
  const items = block.content.items;

  if (!items.length) return null;

  const safeIndex = index >= items.length ? 0 : index;
  const current = items[safeIndex];

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={block.content.title}
      aria-describedby={`${regionId}-status`}
      className="space-y-4"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          setIndex((value) => (value + 1) % items.length);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          setIndex((value) => (value - 1 + items.length) % items.length);
        }
      }}
    >
      <Card className="p-6">
        <ViewportEvent eventName="testimonial_slide" eventProps={{ index: safeIndex }} once={false} />
        <div className="mb-4 flex gap-1 text-gold" aria-label="5 star rating">
          {Array.from({ length: 5 }).map((_, starIndex) => (
            <span key={starIndex} aria-hidden="true">
              *
            </span>
          ))}
        </div>
        <p className="text-lg leading-8 text-white/90">&ldquo;{current.quote}&rdquo;</p>
        <footer className="mt-5 text-sm text-white/60">
          {current.name}
          {" \u00b7 "}
          {current.role}
        </footer>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <p id={`${regionId}-status`} aria-live="polite" className="text-sm text-white/60">
          Testimonial {safeIndex + 1} of {items.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cn(buttonClassName({ variant: "secondary", size: "sm" }))}
            aria-label="Previous testimonial"
            onClick={() => setIndex((value) => (value - 1 + items.length) % items.length)}
          >
            Prev
          </button>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {items.map((_, dotIndex) => (
              <span
                key={dotIndex}
                className={cn(
                  "h-1.5 w-1.5 rounded-full bg-white/20 transition-all",
                  dotIndex === safeIndex && "w-5 bg-gold/80"
                )}
              />
            ))}
          </div>
          <button
            type="button"
            className={cn(buttonClassName({ variant: "secondary", size: "sm" }))}
            aria-label="Next testimonial"
            onClick={() => setIndex((value) => (value + 1) % items.length)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
