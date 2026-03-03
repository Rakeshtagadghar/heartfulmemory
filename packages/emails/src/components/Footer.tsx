import { Link, Section, Text } from "@react-email/components";
import { emailTheme } from "../theme/tokens";

type Props = {
  appName: string;
  supportUrl: string;
};

export function Footer({ appName, supportUrl }: Props) {
  return (
    <Section
      style={{
        marginTop: "20px",
        paddingTop: "14px",
        borderTop: `1px solid ${emailTheme.colors.border}`
      }}
    >
      <Text
        style={{
          margin: "0 0 10px",
          color: emailTheme.colors.muted,
          fontSize: "13px",
          lineHeight: "1.5"
        }}
      >
        If you did not request this, you can safely ignore this email.
      </Text>
      <Text
        style={{
          margin: "0",
          color: emailTheme.colors.muted,
          fontSize: "12px",
          lineHeight: "1.5"
        }}
      >
        Need help?{" "}
        <Link href={supportUrl} style={{ color: emailTheme.colors.link }}>
          Contact support
        </Link>
      </Text>
      <Text
        style={{
          margin: "10px 0 0",
          color: emailTheme.colors.muted,
          fontSize: "12px"
        }}
      >
        {appName} | Keep your story safe
      </Text>
    </Section>
  );
}
