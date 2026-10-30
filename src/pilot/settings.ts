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
  /** נתוני רקע לדף הבית ולמבט מטה. מוצגים רק כש-show דלוק (אישור של אביעד). */
  background?: {
    show?: boolean;
    show_note?: string;
    source: string;
    pilot_months: number;
    social_ties_from: number;
    social_ties_to: number;
    delay_months: number;
    authorities_2027: number;
    budget_label: string;
    level3_population_label: string;
  };
  citizen: {
    persona_id: string;
    /** מבוטל ב-0.6: היתרה נגזרת מהאירועים בלבד. */
    baseline_spent_this_month?: number;
    max_choices_per_step: number;
    default_language: string;
    languages: string[];
  };
  /** יחידת התצוגה של הארנק. ראו src/lib/wallet.ts. */
  wallet?: { unit: "points" | "shekel"; simulated: boolean };
  /** תמריצים בנקודות (הצעה). ראו src/lib/incentives.ts. */
  incentives?: {
    enabled: boolean;
    enabled_note?: string;
    rates: { volunteer_hour: number; teach_session: number; persistence_month: number; goal: number };
    monthly_cap: number;
    persistence_min_share: number;
    status?: string;
    funding_note?: string;
  };
  /** תמחור שירות רציף: מנוי חודשי. הצעה. */
  pricing?: { subscription_units: string[]; sessions_per_month_default: number; status?: string };
  /** הצגת דירוג הספק (רכיבים: src/lib/supplierRating.ts). לא משנה את משקלות ההתאמה. */
  supplier_rating?: { show: boolean; components?: string[]; status?: string };
  companion: {
    name: string;
    /** השכונה של המלווה: התיק והקהילה שלה. */
    neighborhood?: string;
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

/** נתוני הרקע, רק אם הוצגו באישור (background.show). אחרת: כלום, ושום מספר לא מופיע. */
export const shownBackground = () => (appSettings.background?.show ? appSettings.background : undefined);
