/**
 * הגדרות האפליקציה (גרסה 0.5). הקובץ public/app-settings.json הוא המקור:
 * הוא נכנס לבנייה כברירת מחדל, ונקרא שוב בעלייה כדי שאפשר יהיה לשנות
 * הדגמה או פיילוט (mode) בלי לבנות מחדש.
 */

import bundled from "../../public/app-settings.json";

export type AppMode = "demo" | "pilot";
export type TriageRule =
  | "hospitalization"
  | "callback"
  | "gated_request"
  | "cognitive_alert"
  | "no_first_service"
  | "low_utilization"
  | "claim_task";

export interface AppSettings {
  mode: AppMode;
  version: string;
  program: { pilot_participants: number; pilot_participants_source: string };
  citizen: {
    persona_id: string;
    baseline_spent_this_month: number;
    max_choices_per_step: number;
    default_language: string;
    languages: string[];
  };
  /** יחידת התצוגה של הארנק. ראו src/lib/wallet.ts. */
  wallet?: { unit: "points" | "shekel"; simulated: boolean };
  companion: {
    name: string;
    caseload_size: number;
    cover_name: string;
    triage_order: TriageRule[];
    approval_reasons: { approve: string[]; reject: string[] };
  };
  demo: { data_label: string };
}

export const appSettings: AppSettings = structuredClone(bundled) as AppSettings;

function isMode(v: unknown): v is AppMode {
  return v === "demo" || v === "pilot";
}

/** קורא את הקובץ שליד האפליקציה. אף פעם לא זורק: בלי רשת נשארת ברירת המחדל. */
export async function loadAppSettings(): Promise<void> {
  try {
    const res = await fetch("./app-settings.json", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as Partial<AppSettings>;
    if (!isMode(data.mode)) return;
    Object.assign(appSettings, { ...data, citizen: { ...appSettings.citizen, ...data.citizen }, wallet: { ...appSettings.wallet, ...data.wallet } as AppSettings["wallet"], companion: { ...appSettings.companion, ...data.companion }, demo: { ...appSettings.demo, ...data.demo } });
  } catch {
    /* בלי רשת: ברירת המחדל מהבנייה */
  }
}

export const isDemo = () => appSettings.mode === "demo";
