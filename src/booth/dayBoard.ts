/**
 * לוח הדוכן: מה באי הדוכן בחרו היום, לפי תחום, ומי התעניין (לפי תפקיד). נשמר ב-localStorage
 * לפי תאריך, כך שכל יום מתחיל מאפס, ולא נשמר שום פרט אישי: רק תחום השירות ושמו, ומונה לכל תפקיד.
 */
import { appSettings } from "@/pilot/settings";
import { getPilot } from "@/pilot/store";
import { serviceById } from "@/pilot/services";

const today = () => new Date().toISOString().slice(0, 10);
const key = () => "booth-board-" + today();
const rolesKey = () => "booth-roles-" + today();

export interface BoothPick {
  cat: string;
  name: string;
  serviceId: string;
  bookingId: string;
}

interface Basket {
  picks: { cat: string; name: string }[];
}

function readJson<T>(k: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(k) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

const read = (): Basket[] => readJson<Basket[]>(key(), []);

function write(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* אחסון חסום */
  }
}

const personaBookings = () => getPilot().derived.bookings.filter((b) => b.citizenId === appSettings.citizen.persona_id && b.status === "booked");

/** מזהי ההזמנות הקיימות בתחילת חוט, כדי לספור רק את מה שהמבקר הוסיף. */
export const bookingIds = (): string[] => personaBookings().map((b) => b.id);

/** הבחירה החדשה של המבקר (האחרונה שנוספה מאז baseline), והיא נרשמת בלוח היום. */
export function recordSince(baseline: string[]): BoothPick | null {
  const fresh = personaBookings().filter((b) => !baseline.includes(b.id));
  if (!fresh.length) return null;
  const picks = fresh.map((b) => {
    const s = serviceById(b.serviceId);
    return { cat: s?.coreCategoryName ?? "איכות חיים", name: s?.name ?? b.serviceName, serviceId: b.serviceId, bookingId: b.id };
  });
  write(key(), [...read(), { picks: picks.map(({ cat, name }) => ({ cat, name })) }]);
  return picks[picks.length - 1];
}

/** שם השירות האחרון שהמבקר הזמין בחוט הנוכחי (לכרטיסי הסיור). */
export function latestPickedName(baseline: string[]): string | null {
  const b = personaBookings().filter((x) => !baseline.includes(x.id));
  const last = b[b.length - 1];
  return last ? serviceById(last.serviceId)?.name ?? last.serviceName : null;
}

export function readBoard() {
  const baskets = read();
  const byCat = new Map<string, number>();
  const byName = new Map<string, number>();
  for (const b of baskets)
    for (const p of b.picks) {
      byCat.set(p.cat, (byCat.get(p.cat) ?? 0) + 1);
      byName.set(p.name, (byName.get(p.name) ?? 0) + 1);
    }
  const sort = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "he"));
  const lastPicks = baskets[baskets.length - 1]?.picks ?? [];
  return { baskets: baskets.length, byCat: sort(byCat), top: sort(byName).slice(0, 3), last: lastPicks[lastPicks.length - 1]?.name ?? null };
}

/** מי התעניין היום: מונה אנונימי לכל תפקיד שותף. */
export const ROLE_IDS = ["provider", "authority", "health", "ministry", "ngo"] as const;
export type RoleId = (typeof ROLE_IDS)[number];

export function noteRole(role: RoleId) {
  const cur = readJson<Record<string, number>>(rolesKey(), {});
  write(rolesKey(), { ...cur, [role]: (cur[role] ?? 0) + 1 });
}

export const readRoles = (): Record<RoleId, number> => {
  const cur = readJson<Record<string, number>>(rolesKey(), {});
  return Object.fromEntries(ROLE_IDS.map((r) => [r, cur[r] ?? 0])) as Record<RoleId, number>;
};
