import { testimonials } from "../../lib/landing-content";
import { ViewportEvent } from "../viewport-event";
import { SectionShell } from "./primitives";

export function TestimonialsSection() {
  return (
    <SectionShell
      id="testimonials"
      title="Made for families, easy for elders"
      kicker="Placeholder reviews for Phase 1"
      theme="pearl"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {testimonials.map((item, index) => (
          <blockquote
            key={item.quote}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-panel"
          >
            <ViewportEvent eventName="testimonial_slide" eventProps={{ index }} once={false} />
            <div className="mb-4 flex gap-1 text-gold" aria-label="5 star rating">
              {Array.from({ length: 5 }).map((_, starIndex) => (
                <span key={`${item.name}-${item.role}-star-${starIndex}`}>*</span>
              ))}
            </div>
            <p className="text-lg leading-8 text-white/90">&ldquo;{item.quote}&rdquo;</p>
            <footer className="mt-5 text-sm text-white/60">
              {item.name} {" · "} {item.role}
            </footer>
          </blockquote>
        ))}
      </div>
    </SectionShell>
  );
}

