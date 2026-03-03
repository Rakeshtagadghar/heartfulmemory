import { Body, Container, Head, Html, Preview, Section } from "@react-email/components";
import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { emailTheme } from "../theme/tokens";

type Props = {
  previewText: string;
  children: ReactNode;
  appName?: string;
  supportUrl: string;
  logoUrl?: string;
};

export function EmailShell({
  previewText,
  children,
  appName = emailTheme.appName,
  supportUrl,
  logoUrl
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body
        style={{
          margin: 0,
          padding: emailTheme.spacing.page,
          backgroundColor: emailTheme.colors.bg,
          fontFamily: emailTheme.typography.fontFamily,
          color: emailTheme.colors.text
        }}
      >
        <Container
          style={{
            maxWidth: emailTheme.maxWidth,
            margin: "0 auto",
            backgroundColor: emailTheme.colors.card,
            border: `1px solid ${emailTheme.colors.border}`,
            borderRadius: emailTheme.radius.card,
            padding: emailTheme.spacing.card,
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)"
          }}
        >
          <Section
            style={{
              margin: "0 0 18px",
              borderRadius: emailTheme.radius.panel,
              border: `1px solid ${emailTheme.colors.border}`,
              backgroundColor: emailTheme.colors.cardInset,
              padding: "14px 16px"
            }}
          >
            <Section
              style={{
                margin: "0 0 10px",
                height: "4px",
                borderRadius: "999px",
                backgroundColor: emailTheme.colors.brandMark
              }}
            />
          </Section>
          <Header appName={appName} logoUrl={logoUrl} />
          <Section style={{ marginTop: "14px" }}>{children}</Section>
          <Footer appName={appName} supportUrl={supportUrl} />
        </Container>
      </Body>
    </Html>
  );
}
