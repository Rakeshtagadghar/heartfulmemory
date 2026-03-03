import { Link, Section, Text } from "@react-email/components";
import { Divider, EmailShell, PrimaryButton, SectionTitle } from "../../components";
import { emailTheme } from "../../theme/tokens";
import type { SubscriptionActiveVars } from "../../contracts/billing";
import { emailAbsoluteUrl, emailDefaultLogoUrl, emailDefaultSupportUrl } from "../../config";

export function SubscriptionActiveTemplate(props: SubscriptionActiveVars) {
  const appName = props.appName || emailTheme.appName;

  return (
    <EmailShell
      previewText={`You're on ${appName} ${props.planName}`}
      appName={appName}
      supportUrl={props.supportUrl}
      logoUrl={props.logoUrl}
    >
      <Section
        style={{
          backgroundColor: emailTheme.colors.panel,
          border: `1px solid ${emailTheme.colors.border}`,
          borderRadius: emailTheme.radius.panel,
          padding: "18px"
        }}
      >
        <Text
          style={{
            margin: "0 0 8px",
            color: emailTheme.colors.brandMark,
            textTransform: "uppercase",
            letterSpacing: "0.11em",
            fontSize: "11px"
          }}
        >
          Billing update
        </Text>
        <SectionTitle>You're on {props.planName}</SectionTitle>
        <Text
          style={{
            margin: "0 0 12px",
            fontSize: emailTheme.typography.bodySize,
            color: emailTheme.colors.text
          }}
        >
          {props.userName ? `Hello ${props.userName},` : "Hello,"}
        </Text>
        <Text
          style={{
            margin: "0 0 12px",
            fontSize: emailTheme.typography.bodySize,
            color: emailTheme.colors.text
          }}
        >
          Your subscription is active. You can manage billing anytime from your account.
        </Text>
        <PrimaryButton href={props.manageBillingUrl}>Manage billing</PrimaryButton>
      </Section>
      <Divider />
      <Text style={{ margin: "0", fontSize: "14px", color: emailTheme.colors.muted }}>
        Billing portal link:
      </Text>
      <Text style={{ margin: "8px 0 0", fontSize: "14px", wordBreak: "break-word" }}>
        <Link href={props.manageBillingUrl} style={{ color: emailTheme.colors.link }}>
          {props.manageBillingUrl}
        </Link>
      </Text>
    </EmailShell>
  );
}

export const subscriptionActivePreviewProps: SubscriptionActiveVars = {
  userName: "Asha",
  planName: "Memorioso Pro",
  manageBillingUrl: emailAbsoluteUrl("/account/billing"),
  supportUrl: emailDefaultSupportUrl,
  logoUrl: emailDefaultLogoUrl
};

export default function SubscriptionActiveTemplatePreview() {
  return <SubscriptionActiveTemplate {...subscriptionActivePreviewProps} />;
}
