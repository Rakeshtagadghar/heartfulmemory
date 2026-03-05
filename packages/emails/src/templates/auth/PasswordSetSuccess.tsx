import { Link, Section, Text } from "@react-email/components";
import { Divider, EmailShell, PrimaryButton, SectionTitle } from "../../components";
import { emailTheme } from "../../theme/tokens";
import type { PasswordSetSuccessVars } from "../../contracts/auth";
import { emailAbsoluteUrl, emailDefaultLogoUrl, emailDefaultSupportUrl } from "../../config";

export function PasswordSetSuccessTemplate(props: PasswordSetSuccessVars) {
  const appName = props.appName || emailTheme.appName;

  return (
    <EmailShell
      previewText={`Your ${appName} password is now set`}
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
          Account security
        </Text>
        <SectionTitle>Password set successfully</SectionTitle>
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
          Your Memorioso password has been set. If this was not you, contact support immediately.
        </Text>
        <PrimaryButton href={props.securityUrl}>Review security settings</PrimaryButton>
      </Section>
      <Divider />
      <Text style={{ margin: "0", fontSize: "14px", color: emailTheme.colors.muted }}>
        If the button does not work, copy and paste this URL:
      </Text>
      <Text style={{ margin: "8px 0 0", fontSize: "14px", wordBreak: "break-word" }}>
        <Link href={props.securityUrl} style={{ color: emailTheme.colors.link }}>
          {props.securityUrl}
        </Link>
      </Text>
    </EmailShell>
  );
}

export const passwordSetSuccessPreviewProps: PasswordSetSuccessVars = {
  userName: "Asha",
  securityUrl: emailAbsoluteUrl("/account/set-password"),
  supportUrl: emailDefaultSupportUrl,
  logoUrl: emailDefaultLogoUrl
};

export default function PasswordSetSuccessTemplatePreview() {
  return <PasswordSetSuccessTemplate {...passwordSetSuccessPreviewProps} />;
}

