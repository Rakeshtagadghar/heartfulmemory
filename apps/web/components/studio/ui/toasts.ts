export type StudioToastKind = "success" | "error" | "info";

export type StudioToastPayload = {
  id?: string;
  kind?: StudioToastKind;
  title: string;
  message?: string;
  durationMs?: number;
};

export const STUDIO_TOAST_EVENT = "studio:toast";

export function showStudioToast(payload: StudioToastPayload) {
  globalThis.dispatchEvent(
    new CustomEvent<StudioToastPayload>(STUDIO_TOAST_EVENT, {
      detail: payload
    })
  );
}
