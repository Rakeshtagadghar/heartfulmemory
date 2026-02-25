"use client";

import { useEffect, useState } from "react";
import { STUDIO_TOAST_EVENT, type StudioToastKind, type StudioToastPayload } from "./toasts";

type ToastItem = Required<Pick<StudioToastPayload, "title">> &
  Omit<StudioToastPayload, "title"> & {
    id: string;
    kind: StudioToastKind;
  };

const toneClass: Record<StudioToastKind, string> = {
  success: "border-emerald-300/20 bg-emerald-500/10 text-emerald-100",
  error: "border-rose-300/20 bg-rose-500/10 text-rose-100",
  info: "border-cyan-300/20 bg-cyan-500/10 text-cyan-100"
};

export function StudioToastsViewport() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onToast(event: Event) {
      const detail = (event as CustomEvent<StudioToastPayload>).detail;
      const id = detail.id ?? `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const next: ToastItem = {
        id,
        kind: detail.kind ?? "info",
        title: detail.title,
        message: detail.message,
        durationMs: detail.durationMs ?? 2600
      };
      setToasts((current) => [...current, next].slice(-4));
      const timer = globalThis.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, next.durationMs);
      return () => globalThis.clearTimeout(timer);
    }

    globalThis.addEventListener(STUDIO_TOAST_EVENT, onToast as EventListener);
    return () => {
      globalThis.removeEventListener(STUDIO_TOAST_EVENT, onToast as EventListener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[150] flex w-[320px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-xl border px-3 py-2 shadow-xl backdrop-blur ${toneClass[toast.kind]}`}
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-semibold">{toast.title}</p>
          {toast.message ? <p className="mt-0.5 text-xs opacity-90">{toast.message}</p> : null}
        </div>
      ))}
    </div>
  );
}
