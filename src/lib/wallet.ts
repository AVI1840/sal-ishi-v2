/**
 * יחידת התצוגה של הארנק. ההחלטה (תוספת 3, מפגש 2): ארנק אישי של 500 נקודות,
 * נקודה = ₪1. בפיילוט ירושלים ייתכנו שוברים עד המעבר לספק העל, ולכן היחידה
 * נקבעת ב-app-settings.json (wallet.unit: points | shekel), בלי קוד.
 *
 * הארנק בכלי מדומה: הוא מציג יתרה ושוק. ספר החשבונות, הנקודות החיות
 * והתשלומים אצל ספק העל.
 */
import { appSettings } from "@/pilot/settings";
import { catalogState } from "@/data/catalogSource";

export type WalletUnit = "points" | "shekel";

export const walletUnit = (): WalletUnit => (appSettings.wallet?.unit === "shekel" ? "shekel" : "points");

const pointsPerShekel = () => catalogState.seed.settings.points_per_shekel || 1;

/** סכום (בשקלים במודל) כפי שהאזרח והמלווה רואים אותו. */
export function amount(shekel: number): string {
  if (walletUnit() === "shekel") return `₪${shekel}`;
  const p = Math.round(shekel * pointsPerShekel());
  return p === 1 ? "נקודה אחת" : `${p} נקודות`;
}

/** שורת ההסבר הקטנה ליד הארנק. */
export function unitNote(): string | null {
  if (walletUnit() === "shekel") return null;
  const pps = pointsPerShekel();
  return pps === 1 ? "נקודה = ₪1" : `${pps} נקודות = ₪1`;
}

/** הערת השוליים של הארנק: היחידה, ושהארנק מדומה (ספר החשבונות אצל ספק העל). */
export function walletFootnote(): string {
  const parts = [unitNote(), appSettings.wallet?.simulated !== false ? "ארנק מדומה להדגמה" : null].filter(Boolean);
  return parts.join(" · ");
}
