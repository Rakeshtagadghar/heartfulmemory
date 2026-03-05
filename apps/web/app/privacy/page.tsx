import type { Metadata } from "next";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "../../lib/support/contact";
import { MarketingLayout } from "../../components/marketing/MarketingLayout";
import { siteNavLinks } from "../../content/siteNavLinks";

export const metadata: Metadata = {
  title: "Privacy Policy | Memorioso",
  description: "How Memorioso collects, uses, and protects your information."
};

export default function PrivacyPage() {
  return (
    <MarketingLayout navLinks={[...siteNavLinks]}>
      <section className="mx-auto min-h-screen w-full max-w-3xl px-6 py-16 text-white">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Legal</p>
        <h1 className="mt-3 font-display text-4xl text-parchment sm:text-5xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-white/55">Effective date: March 3, 2026</p>

        <div className="mt-6 space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-white/80">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-parchment">Information we collect</h2>
            <p>
              We collect information needed to run Memorioso, including account details (such as email), storybook
              content you create or upload, billing events, and basic operational logs for security and reliability.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-parchment">How we use information</h2>
            <p>
              We use your information to provide the service, authenticate accounts, deliver transactional emails,
              process subscriptions, prevent abuse, and provide customer support.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-parchment">Sharing and processors</h2>
            <p>
              We may share data with infrastructure and service providers that help us operate Memorioso (for example:
              hosting, authentication, payments, and email delivery). We do not sell personal data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-parchment">Retention and deletion</h2>
            <p>
              We keep data for as long as needed to operate the service and meet legal obligations. You can request
              data deletion by emailing{" "}
              <a href={SUPPORT_MAILTO} className="text-gold hover:text-[#e8cc95]">
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-parchment">Policy updates</h2>
            <p>
              We may update this policy as the product evolves. Material changes will be reflected by updating the
              effective date on this page.
            </p>
          </section>
        </div>
      </section>
    </MarketingLayout>
  );
}
