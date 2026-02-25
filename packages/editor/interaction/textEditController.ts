import { sanitizePlainText } from "../utils/sanitizePlainText";

export function shouldEnterTextEditMode(event: { detail?: number; key?: string }) {
  return event.key === "Enter" || event.detail === 2;
}

export function getSanitizedPastedText(event: Pick<ClipboardEvent, "clipboardData">) {
  const text = event.clipboardData?.getData("text/plain") ?? "";
  return sanitizePlainText(text);
}

