import { Column, Img, Row, Section, Text } from "@react-email/components";
import { emailTheme } from "../theme/tokens";

type Props = {
  appName: string;
  logoUrl?: string;
};

export function Header({ appName, logoUrl }: Props) {
  return (
    <Section style={{ marginBottom: "18px" }}>
      {logoUrl ? (
        <Section style={{ marginBottom: "12px" }}>
          <Img
            src={logoUrl}
            width="235"
            height="58"
            alt={`${appName} logo`}
            style={{ display: "block", maxWidth: "100%", height: "auto" }}
          />
        </Section>
      ) : null}
      <Row>
        <Column width="52">
          <Section
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              border: `1px solid ${emailTheme.colors.brandMark}`,
              backgroundColor: emailTheme.colors.cardInset,
              textAlign: "center"
            }}
          >
            <Text
              style={{
                margin: "8px 0 0",
                fontSize: "24px",
                lineHeight: "24px",
                color: emailTheme.colors.heading,
                fontFamily: emailTheme.typography.displayFamily,
                fontWeight: 700
              }}
            >
              M
            </Text>
          </Section>
        </Column>
        <Column>
          <Text
            style={{
              margin: "0",
              color: emailTheme.colors.heading,
              fontSize: "28px",
              lineHeight: "1",
              fontFamily: emailTheme.typography.displayFamily,
              fontWeight: 700
            }}
          >
            {appName}
          </Text>
          <Text
            style={{
              margin: "6px 0 0",
              color: emailTheme.colors.muted,
              letterSpacing: "0.13em",
              textTransform: "uppercase",
              fontSize: "11px"
            }}
          >
            Heirloom Storybooks
          </Text>
        </Column>
      </Row>
    </Section>
  );
}
