import type { Metadata } from "next";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "../../lib/support/contact";
import { MarketingLayout } from "../../components/marketing/MarketingLayout";
import { siteNavLinks } from "../../content/siteNavLinks";

export const metadata: Metadata = {
  title: "Terms | Memorioso",
  description: "Terms for using Memorioso."
};

export default function TermsPage() {
  return (
    <MarketingLayout navLinks={[...siteNavLinks]}>
      <section className="mx-auto min-h-screen w-full max-w-3xl px-6 py-16 text-white">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Legal</p>
        <h1 className="mt-3 font-display text-4xl text-parchment sm:text-5xl">Terms of Use</h1>
        <p className="mt-2 text-sm text-white/55">Effective date: March 3, 2026</p>

        <div className="mt-6 space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-white/80">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-parchment">Use of the service</h2>
            <p>
              Memorioso provides tools to create and manage family storybooks. By using the service, you agree to use
              it lawfully and responsibly.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-parchment">Your content</h2>
            <p>
              You are responsible for content you upload, record, or share, and for ensuring you have rights to use
              that content. You retain ownership of your story content.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-parchment">Accounts and security</h2>
            <p>
              Keep your account credentials secure and notify us if you suspect unauthorized access. We may suspend
              accounts for abuse, fraud, or harmful behavior.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-parchment">Billing</h2>
            <p>
              Paid features, if enabled, are billed according to the plan terms shown at checkout. Subscription
              management and payment updates are handled via our billing portal.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-parchment">Changes to terms</h2>
            <p>
              We may update these terms as Memorioso evolves. Continued use after updates means you accept the revised
              terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-parchment">Contact</h2>
            <p>
              For questions about these terms, email{" "}
              <a href={SUPPORT_MAILTO} className="text-gold hover:text-[#e8cc95]">
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </section>
    </MarketingLayout>
  );
}
