"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "voice_consent_v1";

export function useVoiceConsent() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    try {
      setHasConsent(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setHasConsent(false);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const grantConsent = () => {
    setHasConsent(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore localStorage failures
    }
  };

  const revokeConsent = () => {
    setHasConsent(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore localStorage failures
    }
  };

  return { isLoaded, hasConsent, grantConsent, revokeConsent };
}

