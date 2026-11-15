// הדגמה או פיילוט: נקבע בקובץ ההגדרות של האתר (app-settings.json, ליד הכלי לאזרח),
// כך שאותו קוד משמש לשניהם. בלי הקובץ (קובץ offline יחיד, הרצה מקומית): הדגמה.

import { useEffect, useState } from "react";

export type AppMode = "demo" | "pilot";

let cached: Promise<AppMode> | null = null;

export function loadAppMode(): Promise<AppMode> {
  cached ??= fetch("../app-settings.json", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { mode?: string } | null) => (j?.mode === "pilot" ? "pilot" : "demo"))
    .catch(() => "demo" as const);
  return cached;
}

export function useAppMode(): AppMode | null {
  const [mode, setMode] = useState<AppMode | null>(null);
  useEffect(() => {
    void loadAppMode().then(setMode);
  }, []);
  return mode;
}
