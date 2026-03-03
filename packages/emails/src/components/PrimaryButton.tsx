import { Button } from "@react-email/components";
import type { ReactNode } from "react";
import { emailTheme } from "../theme/tokens";

type Props = {
  href: string;
  children: ReactNode;
};

export function PrimaryButton({ href, children }: Props) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: emailTheme.colors.accent,
        color: emailTheme.colors.accentText,
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: emailTheme.radius.button,
        textDecoration: "none",
        fontWeight: 700,
        fontSize: "15px",
        display: "inline-block",
        padding: "12px 18px",
        letterSpacing: "0.01em"
      }}
    >
      {children}
    </Button>
  );
}
