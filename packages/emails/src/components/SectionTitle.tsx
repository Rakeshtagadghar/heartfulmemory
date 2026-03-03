import { Text } from "@react-email/components";
import type { ReactNode } from "react";
import { emailTheme } from "../theme/tokens";

type Props = {
  children: ReactNode;
};

export function SectionTitle({ children }: Props) {
  return (
    <Text
      style={{
        margin: "0 0 12px",
        color: emailTheme.colors.heading,
        fontSize: emailTheme.typography.headingSize,
        lineHeight: "1.2",
        fontWeight: 700,
        fontFamily: emailTheme.typography.displayFamily
      }}
    >
      {children}
    </Text>
  );
}
