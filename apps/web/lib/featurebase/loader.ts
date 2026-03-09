"use client";

import {
  trackFeaturebaseFeedbackOpened,
  trackFeaturebaseFeedbackSubmitted,
  trackFeaturebaseMessengerOpened,
  type FeaturebaseEventContext
} from "../analytics/featurebaseEvents";
import {
  markFeaturebaseChangelogSeen,
  readFeaturebaseChangelogUnreadCount,
  writeFeaturebaseChangelogUnreadCount
} from "./lastSeen";

const FEATUREBASE_SCRIPT_ID = "featurebase-sdk";
const FEATUREBASE_SCRIPT_SRC = "https://do.featurebase.app/js/sdk.js";

type FeaturebaseCallback = (...args: unknown[]) => void;
type FeaturebasePayload = Record<string, unknown>;
type FeaturebaseQueueCall = [
  command: string,
  payloadOrCallback?: FeaturebasePayload | FeaturebaseCallback,
  callback?: FeaturebaseCallback
];

export type FeaturebaseCommand = ((
  command: string,
  payloadOrCallback?: FeaturebasePayload | FeaturebaseCallback,
  callback?: FeaturebaseCallback
) => void) & {
  q?: FeaturebaseQueueCall[];
};

export type FeaturebasePublicConfig = {
  enabled: boolean;
  organization: string | null;
  appId: string | null;
  feedbackDefaultBoard: string | null;
  locale: string;
  feedbackEnabled: boolean;
  changelogEnabled: boolean;
  messengerEnabled: boolean;
};

declare global {
  interface Window {
    Featurebase?: FeaturebaseCommand;
  }
}

let sdkPromise: Promise<FeaturebaseCommand | null> | null = null;
let feedbackInitialized = false;
let changelogInitialized = false;
let messengerInitialized = false;
let unreadChangelogCount = 0;
let messengerVisible = false;
let lastFeedbackContext: FeaturebaseEventContext | null = null;
const changelogUnreadListeners = new Set<(count: number) => void>();
const messengerVisibilityListeners = new Set<(visible: boolean) => void>();
let messengerVisibilityObserverInitialized = false;

function parseBoolean(raw: string | undefined, fallback = false) {
  if (!raw) return fallback;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on") return true;
  if (normalized === "0" || normalized === "false" || normalized === "no" || normalized === "off") return false;
  return fallback;
}

function trimEnv(raw: string | undefined) {
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}

function canUseDom() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function hasVisibleFeaturebaseIframe() {
  if (!canUseDom()) return false;

  const iframes = Array.from(document.querySelectorAll("iframe"));
  return iframes.some((iframe) => {
    const src = iframe.getAttribute("src") ?? "";
    if (!src.includes("featurebase")) return false;

    const rect = iframe.getBoundingClientRect();
    const style = window.getComputedStyle(iframe);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  });
}

function syncMessengerVisibilityFromDom() {
  if (!messengerVisible) return;
  if (!hasVisibleFeaturebaseIframe()) {
    setMessengerVisible(false);
  }
}

function ensureMessengerVisibilityObserver() {
  if (!canUseDom() || messengerVisibilityObserverInitialized) return;

  const start = () => {
    const observer = new MutationObserver(() => {
      syncMessengerVisibilityFromDom();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class", "hidden", "aria-hidden"]
    });
    window.addEventListener("focus", syncMessengerVisibilityFromDom);
    document.addEventListener("visibilitychange", syncMessengerVisibilityFromDom);
  };

  if (document.body) {
    start();
  } else {
    window.addEventListener(
      "load",
      () => {
        if (document.body) start();
      },
      { once: true }
    );
  }

  messengerVisibilityObserverInitialized = true;
}

function ensureFeaturebaseStub() {
  if (!canUseDom()) return null;
  if (typeof window.Featurebase === "function") return window.Featurebase;

  const stub = ((
    command: string,
    payloadOrCallback?: FeaturebasePayload | FeaturebaseCallback,
    callback?: FeaturebaseCallback
  ) => {
    (stub.q ??= []).push([command, payloadOrCallback, callback]);
  }) as FeaturebaseCommand;
  stub.q = [];
  window.Featurebase = stub;
  return stub;
}

export function getFeaturebasePublicConfig(): FeaturebasePublicConfig {
  const enabled = parseBoolean(process.env.NEXT_PUBLIC_FEATUREBASE_ENABLED, false);
  const organization = trimEnv(process.env.NEXT_PUBLIC_FEATUREBASE_ORGANIZATION);
  const appId = trimEnv(process.env.NEXT_PUBLIC_FEATUREBASE_APP_ID);
  const feedbackDefaultBoard = trimEnv(process.env.NEXT_PUBLIC_FEATUREBASE_FEEDBACK_DEFAULT_BOARD);
  const locale = trimEnv(process.env.NEXT_PUBLIC_FEATUREBASE_LOCALE) ?? "en";

  return {
    enabled,
    organization,
    appId,
    feedbackDefaultBoard,
    locale,
    feedbackEnabled: enabled && Boolean(organization),
    changelogEnabled: enabled && Boolean(organization),
    messengerEnabled: enabled && Boolean(appId)
  };
}

export function getFeaturebaseScriptId() {
  return FEATUREBASE_SCRIPT_ID;
}

export async function loadFeaturebaseSdk(): Promise<FeaturebaseCommand | null> {
  if (!canUseDom()) return null;

  const existingScript = document.getElementById(FEATUREBASE_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript?.dataset.loaded === "true" && typeof window.Featurebase === "function") {
    return window.Featurebase;
  }

  if (sdkPromise) return sdkPromise;

  const featurebase = ensureFeaturebaseStub();
  sdkPromise = new Promise<FeaturebaseCommand | null>((resolve, reject) => {
    const currentScript = document.getElementById(FEATUREBASE_SCRIPT_ID) as HTMLScriptElement | null;
    if (currentScript) {
      currentScript.addEventListener(
        "load",
        () => {
          currentScript.dataset.loaded = "true";
          resolve(window.Featurebase ?? featurebase);
        },
        { once: true }
      );
      currentScript.addEventListener(
        "error",
        () => {
          sdkPromise = null;
          reject(new Error("Featurebase SDK failed to load."));
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = FEATUREBASE_SCRIPT_ID;
    script.async = true;
    script.src = FEATUREBASE_SCRIPT_SRC;
    script.dataset.loaded = "false";
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve(window.Featurebase ?? featurebase);
      },
      { once: true }
    );
    script.addEventListener(
      "error",
      () => {
        sdkPromise = null;
        script.remove();
        reject(new Error("Featurebase SDK failed to load."));
      },
      { once: true }
    );
    document.head.appendChild(script);
  });

  return sdkPromise;
}

export async function initializeFeaturebaseForAuthenticatedApp() {
  const config = getFeaturebasePublicConfig();
  if (!config.enabled) return { enabled: false as const, loaded: false as const };
  if (!config.feedbackEnabled && !config.changelogEnabled && !config.messengerEnabled) {
    return { enabled: true as const, loaded: false as const };
  }

  const featurebase = await loadFeaturebaseSdk();
  if (!featurebase) return { enabled: true as const, loaded: false as const };

  if (config.feedbackEnabled && !feedbackInitialized) {
    featurebase(
      "initialize_feedback_widget",
      {
        organization: config.organization,
        theme: "dark",
        locale: config.locale,
        ...(config.feedbackDefaultBoard ? { defaultBoard: config.feedbackDefaultBoard } : {})
      },
      (...args) => {
        const [, callback] = args as [unknown, { action?: string }?];
        if (callback?.action === "widgetOpened" && lastFeedbackContext) {
          trackFeaturebaseFeedbackOpened(lastFeedbackContext);
        }
        if (callback?.action === "feedbackSubmitted" && lastFeedbackContext) {
          trackFeaturebaseFeedbackSubmitted(lastFeedbackContext);
        }
      }
    );
    feedbackInitialized = true;
  }

  if (config.changelogEnabled && !changelogInitialized) {
    featurebase(
      "init_changelog_widget",
      {
        organization: config.organization,
        theme: "dark",
        locale: config.locale,
        popup: {
          enabled: true,
          autoOpenForNewUpdates: false
        },
        dropdown: {
          enabled: true,
          placement: "right"
        }
      },
      (...args) => {
        const [, data] = args as [unknown, { action?: string; unreadCount?: number }?];
        if (data?.action === "unreadChangelogsCountChanged") {
          setUnreadChangelogCount(data.unreadCount ?? 0);
        }
      }
    );
    changelogInitialized = true;
    setUnreadChangelogCount(readFeaturebaseChangelogUnreadCount());
  }

  if (config.messengerEnabled && !messengerInitialized) {
    featurebase("boot", {
      appId: config.appId,
      theme: "dark",
      language: config.locale,
      hideDefaultLauncher: true
    });
    ensureMessengerVisibilityObserver();
    featurebase("onShow", () => {
      setMessengerVisible(true);
    });
    featurebase("onHide", () => {
      setMessengerVisible(false);
    });
    messengerInitialized = true;
  }

  return {
    enabled: true as const,
    loaded: true as const,
    feedbackInitialized,
    changelogInitialized,
    messengerInitialized
  };
}

function setUnreadChangelogCount(count: number) {
  unreadChangelogCount = Math.max(0, Math.floor(count));
  writeFeaturebaseChangelogUnreadCount(unreadChangelogCount);
  for (const listener of changelogUnreadListeners) {
    listener(unreadChangelogCount);
  }
}

function setMessengerVisible(visible: boolean) {
  messengerVisible = visible;
  for (const listener of messengerVisibilityListeners) {
    listener(messengerVisible);
  }
}

export function getFeaturebaseChangelogUnreadCount() {
  return unreadChangelogCount || readFeaturebaseChangelogUnreadCount();
}

export function subscribeToFeaturebaseChangelogUnreadCount(listener: (count: number) => void) {
  changelogUnreadListeners.add(listener);
  listener(getFeaturebaseChangelogUnreadCount());
  return () => {
    changelogUnreadListeners.delete(listener);
  };
}

export function getFeaturebaseMessengerVisible() {
  return messengerVisible;
}

export function subscribeToFeaturebaseMessengerVisibility(listener: (visible: boolean) => void) {
  messengerVisibilityListeners.add(listener);
  listener(getFeaturebaseMessengerVisible());
  return () => {
    messengerVisibilityListeners.delete(listener);
  };
}

export async function openFeaturebaseFeedback(context: FeaturebaseEventContext, board?: string | null) {
  const config = getFeaturebasePublicConfig();
  if (!config.feedbackEnabled || typeof window === "undefined") return;

  lastFeedbackContext = context;
  await initializeFeaturebaseForAuthenticatedApp();
  window.postMessage(
    {
      target: "FeaturebaseWidget",
      data: {
        action: "openFeedbackWidget",
        ...(board ? { setBoard: board } : {})
      }
    },
    window.location.origin
  );
}

export async function openFeaturebaseChangelog() {
  const config = getFeaturebasePublicConfig();
  if (!config.changelogEnabled) return;

  const result = await initializeFeaturebaseForAuthenticatedApp();
  if (!result.loaded || typeof window.Featurebase !== "function") return;

  window.Featurebase("manually_open_changelog_popup");
  window.Featurebase("set_all_changelogs_as_viewed");
  markFeaturebaseChangelogSeen();
  setUnreadChangelogCount(0);
}

export async function openFeaturebaseMessenger(
  context: FeaturebaseEventContext,
  view: "default" | "new-message" = "default"
) {
  const config = getFeaturebasePublicConfig();
  if (!config.messengerEnabled) return;

  const result = await initializeFeaturebaseForAuthenticatedApp();
  if (!result.loaded || typeof window.Featurebase !== "function") return;

  if (view === "new-message") {
    window.Featurebase("showNewMessage");
  } else {
    window.Featurebase("show");
  }

  setMessengerVisible(true);
  trackFeaturebaseMessengerOpened(context);
}

export async function closeFeaturebaseMessenger() {
  const config = getFeaturebasePublicConfig();
  if (!config.messengerEnabled) return;

  const result = await initializeFeaturebaseForAuthenticatedApp();
  if (!result.loaded || typeof window.Featurebase !== "function") return;

  window.Featurebase("hide");
  setMessengerVisible(false);
}

export const __featurebaseLoaderTestUtils = {
  reset() {
    sdkPromise = null;
    feedbackInitialized = false;
    changelogInitialized = false;
    messengerInitialized = false;
    unreadChangelogCount = 0;
    messengerVisible = false;
    lastFeedbackContext = null;
    changelogUnreadListeners.clear();
    messengerVisibilityListeners.clear();
    if (!canUseDom()) return;
    const script = document.getElementById(FEATUREBASE_SCRIPT_ID);
    script?.remove();
    delete window.Featurebase;
  }
};
