"use client";

import { useEffect, useState } from "react";

export function useReducedMotionPreference() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mediaQuery.matches);

    onChange();
    mediaQuery.addEventListener?.("change", onChange);

    return () => mediaQuery.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}

