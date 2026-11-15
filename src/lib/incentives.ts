/**
 * תמריצים בנקודות (הצעה): נתינה לקהילה (התנדבות, הדרכת חוג או הרצאה), התמדה
 * ועמידה ביעד אישי. מותאם אישית ולא לכולם: המלווה מסמנת למי זה מתאים, והמערכת
 * רק מציעה. כל תמריץ באישור המלווה, ויש תקרה חודשית לאזרח. התעריפים בהגדרות.
 */
import type { PersonalProfile } from "@/data/types";
import type { Booking, Incentive, IncentiveReason, IncentiveRole } from "@/pilot/model";
import { attendedIn } from "@/pilot/services";
import { appSettings } from "@/pilot/settings";

export const incentivesOn = () => appSettings.incentives?.enabled !== false;
const cfg = () => appSettings.incentives ?? { rates: { volunteer_hour: 15, teach_session: 40, persistence_month: 20, goal: 30 }, monthly_cap: 100, persistence_min_share: 0.75, enabled: true };

export function rateOf(reason: IncentiveReason, hours = 1): number {
  const r = cfg().rates;
  return reason === "volunteer" ? r.volunteer_hour * hours : reason === "teach" ? r.teach_session : reason === "persistence" ? r.persistence_month : r.goal;
}

export const monthlyCap = () => cfg().monthly_cap;

/** כמה תמריצים קיבל האזרח החודש, וכמה עוד אפשר לפי התקרה. */
export function incentiveRoom(incentives: Incentive[], citizenId: string, now = new Date()): { given: number; left: number } {
  const month = now.toISOString().slice(0, 7);
  const given = incentives.filter((i) => i.citizenId === citizenId && i.at.slice(0, 7) === month).reduce((n, i) => n + i.points, 0);
  return { given, left: Math.max(0, monthlyCap() - given) };
}

/** הצעה למלווה: התמדה במנוי החודש (לפחות 75% מהמפגשים), אם עוד לא ניתן תמריץ התמדה החודש. */
export function persistenceSuggestion(bookings: Booking[], incentives: Incentive[], citizenId: string, now = new Date()): Booking | null {
  const month = now.toISOString().slice(0, 7);
  if (incentives.some((i) => i.citizenId === citizenId && i.reason === "persistence" && i.at.slice(0, 7) === month)) return null;
  return (
    bookings.find(
      (b) =>
        b.citizenId === citizenId &&
        b.status === "booked" &&
        b.mode === "subscription" &&
        attendedIn(b, month) / (b.sessionsPerMonth ?? 4) >= cfg().persistence_min_share,
    ) ?? null
  );
}

const TEACH_TOPICS: [RegExp, string][] = [
  [/שיר|מקהל|מוזיק/, "להוביל שירה בציבור במועדון השכונתי"],
  [/בישול|לבשל/, "להעביר סדנת בישול לחג"],
  [/קריא|ספר|היסטוריה|ללמוד/, "לספר בהרצאה על מה שאת${g} יודע${g2} מהחיים"],
  [/שחמט|משחק/, "ללמד שחמט בקבוצה"],
];

/** ההצעה האישית לאזרח: מה הוא יכול לתת, לפי מה שסיפר. */
export function giveOffers(p: PersonalProfile, roles: IncentiveRole[]): { title: string; detail: string }[] {
  const said = [p.dream ?? "", ...(p.preferredActivities ?? []), ...(p.interests ?? [])].join(" ");
  const male = p.gender === "male";
  const out: { title: string; detail: string }[] = [];
  if (roles.includes("teach")) {
    const topic = TEACH_TOPICS.find(([re]) => re.test(said))?.[1]?.replace("${g}", male ? "ה" : "").replace("${g2}", male ? "" : "ת") ?? "להעביר חוג או הרצאה במה שאת" + (male ? "ה" : "") + " אוהב" + (male ? "" : "ת");
    out.push({ title: topic, detail: `${rateOf("teach")} נקודות על כל מפגש שמעבירים.` });
  }
  if (roles.includes("volunteer")) {
    out.push({ title: "להתנדב בשכונה: ליווי, קריאה, עזרה במועדון", detail: `${rateOf("volunteer")} נקודות על כל שעה.` });
  }
  return out;
}
