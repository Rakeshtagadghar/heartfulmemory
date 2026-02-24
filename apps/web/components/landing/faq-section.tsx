import { faqs } from "../../lib/landing-content";
import { FaqAccordion } from "../faq-accordion";
import { SectionShell } from "./primitives";

export function FaqSection() {
  return (
    <SectionShell
      id="faq"
      title="Frequently asked questions"
      kicker="Clear answers before you commit"
      theme="midnight"
    >
      <FaqAccordion items={[...faqs]} />
    </SectionShell>
  );
}
