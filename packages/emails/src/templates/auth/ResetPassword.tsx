import { Link, Section, Text } from "@react-email/components";
import { Divider, EmailShell, PrimaryButton, SectionTitle } from "../../components";
import { emailTheme } from "../../theme/tokens";
import type { ResetPasswordVars } from "../../contracts/auth";
import { emailAbsoluteUrl, emailDefaultLogoUrl, emailDefaultSupportUrl } from "../../config";

export function ResetPasswordTemplate(props: ResetPasswordVars) {
  const appName = props.appName || emailTheme.appName;

  return (
    <EmailShell
      previewText={`Reset your ${appName} password`}
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
          Password reset
        </Text>
        <SectionTitle>Reset your password</SectionTitle>
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
          We received a request to reset your password.
        </Text>
        <PrimaryButton href={props.resetUrl}>Set new password</PrimaryButton>
        <Text style={{ margin: "14px 0 0", fontSize: "14px", color: emailTheme.colors.muted }}>
          This link expires in {props.expiryMinutes} minutes.
        </Text>
      </Section>
      <Divider />
      <Text style={{ margin: "0", fontSize: "14px", color: emailTheme.colors.muted }}>
        If the button does not work, copy and paste this URL:
      </Text>
      <Text style={{ margin: "8px 0 0", fontSize: "14px", wordBreak: "break-word" }}>
        <Link href={props.resetUrl} style={{ color: emailTheme.colors.link }}>
          {props.resetUrl}
        </Link>
      </Text>
    </EmailShell>
  );
}

export const resetPasswordPreviewProps: ResetPasswordVars = {
  userName: "Asha",
  resetUrl: emailAbsoluteUrl("/auth/reset-password/verify?token=demo"),
  expiryMinutes: 30,
  supportUrl: emailDefaultSupportUrl,
  logoUrl: emailDefaultLogoUrl
};

export default function ResetPasswordTemplatePreview() {
  return <ResetPasswordTemplate {...resetPasswordPreviewProps} />;
}
