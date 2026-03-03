import { Link, Section, Text } from "@react-email/components";
import {
  Divider,
  EmailShell,
  PrimaryButton,
  SectionTitle,
} from "../../components";
import { emailTheme } from "../../theme/tokens";
import type { PaymentFailedVars } from "../../contracts/billing";
import {
  emailAbsoluteUrl,
  emailDefaultLogoUrl,
  emailDefaultSupportUrl,
} from "../../config";

export function PaymentFailedTemplate(props: PaymentFailedVars) {
  const appName = props.appName || emailTheme.appName;

  return (
    <EmailShell
      previewText={`Payment failed for ${appName}`}
      appName={appName}
      supportUrl={props.supportUrl}
      logoUrl={props.logoUrl}
    >
      <Section
        style={{
          backgroundColor: emailTheme.colors.warningBg,
          border: `1px solid ${emailTheme.colors.warningBorder}`,
          borderRadius: emailTheme.radius.panel,
          padding: "18px",
        }}
      >
        <Text
          style={{
            margin: "0 0 8px",
            color: emailTheme.colors.warning,
            textTransform: "uppercase",
            letterSpacing: "0.11em",
            fontSize: "11px",
          }}
        >
          Billing action needed
        </Text>
        <SectionTitle>Payment failed - action needed</SectionTitle>
        <Text
          style={{
            margin: "0 0 12px",
            fontSize: emailTheme.typography.bodySize,
            color: emailTheme.colors.text,
          }}
        >
          {props.userName ? `Hello ${props.userName},` : "Hello,"}
        </Text>
        <Text
          style={{
            margin: "0 0 12px",
            fontSize: emailTheme.typography.bodySize,
            color: emailTheme.colors.text,
          }}
        >
          We could not process your latest payment. Please update your payment
          method before {props.retryDate}.
        </Text>
        <PrimaryButton href={props.manageBillingUrl}>
          Update billing method
        </PrimaryButton>
        <Text
          style={{
            margin: "12px 0 0",
            fontSize: "13px",
            color: emailTheme.colors.warning,
          }}
        >
          We do not include sensitive billing details in this email.
        </Text>
      </Section>
      <Divider />
      <Text
        style={{
          margin: "0",
          fontSize: "14px",
          color: emailTheme.colors.muted,
        }}
      >
        Billing portal link:
      </Text>
      <Text
        style={{ margin: "8px 0 0", fontSize: "14px", wordBreak: "break-word" }}
      >
        <Link
          href={props.manageBillingUrl}
          style={{ color: emailTheme.colors.link }}
        >
          {props.manageBillingUrl}
        </Link>
      </Text>
    </EmailShell>
  );
}

export const paymentFailedPreviewProps: PaymentFailedVars = {
  userName: "Asha",
  manageBillingUrl: emailAbsoluteUrl("/account/billing"),
  retryDate: "March 10, 2026",
  supportUrl: emailDefaultSupportUrl,
  logoUrl: emailDefaultLogoUrl,
};

export default function PaymentFailedTemplatePreview() {
  return <PaymentFailedTemplate {...paymentFailedPreviewProps} />;
}
