import { Hr } from "@react-email/components";
import { emailTheme } from "../theme/tokens";

export function Divider() {
  return <Hr style={{ borderColor: emailTheme.colors.border, margin: "22px 0", opacity: "0.65" }} />;
}
