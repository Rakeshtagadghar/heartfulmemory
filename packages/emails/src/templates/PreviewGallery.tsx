import { Link, Section, Text } from "@react-email/components";
import { EmailShell, SectionTitle } from "../components";
import { emailTheme } from "../theme/tokens";
import { emailDefaultLogoUrl, emailDefaultSupportUrl } from "../config";

const templates = [
  { id: "preview/auth/VerifyEmail", title: "Auth: Verify Email" },
  { id: "preview/auth/LoginLinkOrCode", title: "Auth: Login Link or Code" },
  { id: "preview/auth/ResetPassword", title: "Auth: Reset Password" },
  { id: "preview/billing/SubscriptionActive", title: "Billing: Subscription Active" },
  { id: "preview/billing/PaymentFailed", title: "Billing: Payment Failed" }
] as const;

export default function PreviewGalleryTemplate() {
  return (
    <EmailShell
      previewText="Memorioso email preview gallery"
      appName={emailTheme.appName}
      supportUrl={emailDefaultSupportUrl}
      logoUrl={emailDefaultLogoUrl}
    >
      <Section>
        <SectionTitle>Email Preview Gallery</SectionTitle>
        <Text
          style={{ margin: "0 0 12px", fontSize: emailTheme.typography.bodySize, color: emailTheme.colors.text }}
        >
          Use this as a quick index while iterating on template look and copy.
        </Text>
        {templates.map((template) => (
          <Text key={template.id} style={{ margin: "0 0 10px", fontSize: "14px" }}>
            - {template.title} ({" "}
            <Link href={`http://localhost:3001/${template.id}`} style={{ color: emailTheme.colors.link }}>
              {template.id}
            </Link>
            )
          </Text>
        ))}
      </Section>
    </EmailShell>
  );
}
