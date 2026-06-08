/**
 * useVisualMode — toggles between "with images" and "clean" citizen interface.
 * State stored in localStorage so it survives navigation and page refreshes.
 */
import { useState, useEffect } from "react";

const KEY = "sal_visual_mode";

export type VisualMode = "images" | "clean";

export function useVisualMode(): [VisualMode, () => void] {
  const [mode, setMode] = useState<VisualMode>(() => {
    try {
      return (localStorage.getItem(KEY) as VisualMode) ?? "images";
    } catch {
      return "images";
    }
  });

  const toggle = () => {
    const next: VisualMode = mode === "images" ? "clean" : "images";
    setMode(next);
    try { localStorage.setItem(KEY, next); } catch {}
    // Notify other components on the same page
    window.dispatchEvent(new CustomEvent("visual_mode_change", { detail: next }));
  };

  // Sync across components (same tab)
  useEffect(() => {
    const handler = (e: Event) => {
      setMode((e as CustomEvent<VisualMode>).detail);
    };
    window.addEventListener("visual_mode_change", handler);
    return () => window.removeEventListener("visual_mode_change", handler);
  }, []);

  return [mode, toggle];
}

/** Returns true when images should be shown */
export function useShowImages(): boolean {
  const [mode] = useVisualMode();
  return mode === "images";
}
