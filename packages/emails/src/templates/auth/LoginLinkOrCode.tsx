import { Link, Section, Text } from "@react-email/components";
import { Divider, EmailShell, PrimaryButton, SectionTitle } from "../../components";
import { emailTheme } from "../../theme/tokens";
import type { LoginLinkOrCodeVars } from "../../contracts/auth";
import { emailAbsoluteUrl, emailDefaultLogoUrl, emailDefaultSupportUrl } from "../../config";

export function LoginLinkOrCodeTemplate(props: LoginLinkOrCodeVars) {
  const appName = props.appName || emailTheme.appName;

  return (
    <EmailShell
      previewText={`Your secure sign-in link for ${appName}`}
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
          Secure sign-in
        </Text>
        <SectionTitle>Your secure sign-in link</SectionTitle>
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
          Tap the button below to sign in.
        </Text>
        <PrimaryButton href={props.loginUrl}>Sign in to {appName}</PrimaryButton>
        <Text style={{ margin: "14px 0 0", fontSize: "14px", color: emailTheme.colors.muted }}>
          This link expires in {props.expiryMinutes} minutes.
        </Text>

        {props.code ? (
          <>
            <Divider />
            <Text style={{ margin: "0 0 8px", fontSize: "14px", color: emailTheme.colors.muted }}>
              If asked for a code, use this:
            </Text>
            <Text
              style={{
                margin: "0",
                fontFamily: "Consolas, 'Courier New', monospace",
                fontSize: "22px",
                letterSpacing: "0.08em",
                fontWeight: 700,
                color: emailTheme.colors.heading,
                backgroundColor: "#091121",
                border: `1px solid ${emailTheme.colors.border}`,
                borderRadius: "10px",
                display: "inline-block",
                padding: "8px 12px"
              }}
            >
              {props.code}
            </Text>
          </>
        ) : null}
      </Section>
      <Divider />
      <Text style={{ margin: "0", fontSize: "14px", color: emailTheme.colors.muted }}>
        If the button does not work, copy and paste this URL:
      </Text>
      <Text style={{ margin: "8px 0 0", fontSize: "14px", wordBreak: "break-word" }}>
        <Link href={props.loginUrl} style={{ color: emailTheme.colors.link }}>
          {props.loginUrl}
        </Link>
      </Text>
    </EmailShell>
  );
}

export const loginLinkOrCodePreviewProps: LoginLinkOrCodeVars = {
  userName: "Asha",
  loginUrl: emailAbsoluteUrl("/auth/sign-in?token=demo"),
  code: "4972",
  expiryMinutes: 20,
  supportUrl: emailDefaultSupportUrl,
  logoUrl: emailDefaultLogoUrl
};

export default function LoginLinkOrCodeTemplatePreview() {
  return <LoginLinkOrCodeTemplate {...loginLinkOrCodePreviewProps} />;
}
