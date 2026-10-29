/**
 * הממשק לחיבור backend של ספק: PilotSyncAdapter. הכלי שולח אירועים
 * (schema/pilot/pilot-event.schema.json) ולא מנהל שרת. ספק שמחבר מערכת
 * מממש push (ואם רוצה גם pull) ומעביר אותו ל-setSyncAdapter, בלי לגעת במסכים.
 *
 * ברירת המחדל בהדגמה ובפיילוט בלי ספק: מתאם מקומי שמסמן את האירועים
 * כנשלחים ומאפשר להוריד אותם כקובץ JSON (כמו FileSyncAdapter של האטלס).
 */

import { useEffect, useState } from "react";
import type { PilotEvent } from "./model";
import { getPilot, markSynced, pendingSync, usePilot } from "./store";

export const PILOT_EVENTS_SCHEMA = "sal-ishi.pilot-events/1.0";

export interface PilotSyncAdapter {
  name: string;
  /** שולח אירועים. מחזיר את המזהים שהתקבלו. אירוע שלא התקבל יישלח שוב. */
  push(events: PilotEvent[]): Promise<{ accepted: string[] }>;
  /** אירועים חדשים מהספק (אופציונלי). */
  pull?(since: string | null): Promise<PilotEvent[]>;
}

export interface PilotEventsFile {
  schema: typeof PILOT_EVENTS_SCHEMA;
  exportedAt: string;
  source: "sal-ishi-pilot";
  events: PilotEvent[];
}

export function eventsFile(events: PilotEvent[]): PilotEventsFile {
  return { schema: PILOT_EVENTS_SCHEMA, exportedAt: new Date().toISOString(), source: "sal-ishi-pilot", events: events.map(({ synced: _s, ...e }) => e as PilotEvent) };
}

export const localAdapter: PilotSyncAdapter = {
  name: "מקומי (בלי ספק)",
  async push(events) {
    return { accepted: events.map((e) => e.id) };
  },
};

let adapter: PilotSyncAdapter = localAdapter;
export const setSyncAdapter = (a: PilotSyncAdapter) => {
  adapter = a;
};
export const syncAdapterName = () => adapter.name;

export async function syncNow(): Promise<number> {
  const pending = pendingSync(getPilot().state);
  if (!pending.length) return 0;
  const { accepted } = await adapter.push(pending);
  markSynced(accepted);
  return accepted.length;
}

/** סנכרון אוטומטי כשהחיבור חוזר. מחזיר את מספר האירועים שממתינים. */
export function useAutoSync(online: boolean): { pending: number; lastSync: string | null } {
  const { state } = usePilot();
  const pending = pendingSync(state).length;
  const [lastSync, setLastSync] = useState<string | null>(null);
  useEffect(() => {
    if (!online || pending === 0) return;
    const timer = setTimeout(() => {
      void syncNow().then((n) => {
        if (n) setLastSync(new Date().toISOString());
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [online, pending]);
  return { pending, lastSync };
}
