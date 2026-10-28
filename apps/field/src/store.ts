// מצב משטח השטח: הנתונים של הרשות, ה-seed הפעיל והפעולות עליהם.
// נשמר בדפדפן בלבד (IndexedDB). מעבר נתונים למטה רק דרך חבילת פיילוט.

import { create } from "zustand";
import {
  defaultSeed,
  openStore,
  parseSeed,
  upgradeSeed,
  upsertActivity,
  type AuthorityData,
  type KeyValueStore,
  type MonthlyActivity,
  type Neighborhood,
  type Seed,
  type Service,
  type Supplier,
  type UnmetDemand,
  type WorkflowStatus,
} from "@sal-ishi/core";
import { buildDemoAuthority } from "@sal-ishi/core";
import { EDITION } from "@sal-ishi/ui";

interface Persisted {
  data: AuthorityData;
  isDemo: boolean;
  seed?: unknown;
  lastPackage?: { hash: string; at: string };
}

export interface FieldState {
  hydrated: boolean;
  seed: Seed;
  seedFromHq: boolean;
  data: AuthorityData;
  isDemo: boolean;
  lastPackage?: { hash: string; at: string };

  hydrate(): Promise<void>;
  setAuthority(name: string): void;
  upsertNeighborhood(n: Neighborhood): void;
  removeNeighborhood(id: string): string | null;
  upsertSupplier(s: Supplier): void;
  removeSupplier(code: string): string | null;
  upsertService(s: Service): void;
  addServices(list: Service[]): void;
  removeService(id: string): void;
  setStatus(ids: string[], status: WorkflowStatus, note?: string): void;
  mergeActivity(list: MonthlyActivity[]): void;
  mergeUnmetDemand(rows: UnmetDemand[]): void;
  setEnrollment(neighborhoodId: string, month: string, enrolled: number): void;
  setSeed(seed: Seed): void;
  markPackageSent(hash: string): void;
  loadDemo(): void;
  reset(): void;
}

const emptyData = (): AuthorityData => ({
  authority: "",
  neighborhoods: [],
  suppliers: [],
  services: [],
  activity: [],
  enrollment: [],
});

let kv: KeyValueStore | null = null;
const KEY = "field-state";

export const useField = create<FieldState>()((set, get) => {
  const update = (fn: (d: AuthorityData) => AuthorityData) => set((s) => ({ data: fn(s.data) }));

  return {
    hydrated: false,
    seed: defaultSeed,
    seedFromHq: false,
    data: emptyData(),
    isDemo: false,

    async hydrate() {
      kv = await openStore("sal-ishi-field");
      const saved = await kv.get<Persisted>(KEY);
      if (saved) {
        let seed = defaultSeed;
        let seedFromHq = false;
        if (saved.seed) {
          try {
            seed = upgradeSeed(parseSeed(saved.seed));
            seedFromHq = true;
          } catch {
            /* seed שמור לא תקין: חוזרים לברירת המחדל */
          }
        }
        set({ data: saved.data, isDemo: saved.isDemo, lastPackage: saved.lastPackage, seed, seedFromHq });
      } else if (EDITION === "preview") {
        // בגרסת התצוגה לשותפים, ביקור ראשון נפתח עם נתוני הדגמה ולא במסך ריק.
        set({ data: buildDemoAuthority(), isDemo: true });
      }
      set({ hydrated: true });
    },

    setAuthority(name) {
      update((d) => ({
        ...d,
        authority: name,
        neighborhoods: d.neighborhoods.map((n) => ({ ...n, authority: name })),
        suppliers: d.suppliers.map((s) => ({ ...s, authority: name })),
        services: d.services.map((s) => ({ ...s, authority: name })),
      }));
    },

    upsertNeighborhood(n) {
      update((d) => ({ ...d, neighborhoods: upsert(d.neighborhoods, n, (x) => x.id) }));
    },

    removeNeighborhood(id) {
      const used = get().data.services.filter((s) => s.neighborhoodId === id).length;
      if (used) return `יש בשכונה ${used} שירותים. העבירו או מחקו אותם קודם.`;
      update((d) => ({
        ...d,
        neighborhoods: d.neighborhoods.filter((n) => n.id !== id),
        enrollment: d.enrollment.filter((e) => e.neighborhoodId !== id),
        suppliers: d.suppliers.map((s) => ({ ...s, neighborhoods: s.neighborhoods.filter((x) => x !== id) })),
      }));
      return null;
    },

    upsertSupplier(s) {
      update((d) => ({ ...d, suppliers: upsert(d.suppliers, s, (x) => x.code) }));
    },

    removeSupplier(code) {
      const used = get().data.services.filter((s) => s.supplierCode === code).length;
      if (used) return `לספק יש ${used} שירותים בקטלוג. מחקו או העבירו אותם קודם.`;
      update((d) => ({ ...d, suppliers: d.suppliers.filter((s) => s.code !== code) }));
      return null;
    },

    upsertService(s) {
      update((d) => ({ ...d, services: upsert(d.services, s, (x) => x.id) }));
    },

    addServices(list) {
      update((d) => ({ ...d, services: [...d.services, ...list] }));
    },

    removeService(id) {
      update((d) => ({
        ...d,
        services: d.services.filter((s) => s.id !== id),
        activity: d.activity.filter((a) => a.serviceId !== id),
      }));
    },

    setStatus(ids, status, note) {
      const set_ = new Set(ids);
      update((d) => ({
        ...d,
        services: d.services.map((s) => {
          if (!set_.has(s.id)) return s;
          const next: Service = { ...s, status };
          if (note !== undefined) next.committeeNote = note;
          else if (status !== "נדחה") delete next.committeeNote;
          return next;
        }),
      }));
    },

    mergeActivity(list) {
      update((d) => ({ ...d, activity: upsertActivity(d.activity, list) }));
    },

    mergeUnmetDemand(rows) {
      const key = (u: UnmetDemand) => `${u.neighborhoodId}|${u.serviceTypeId}|${u.month}`;
      update((d) => {
        const map = new Map((d.unmetDemand ?? []).map((u) => [key(u), u]));
        for (const r of rows) map.set(key(r), r);
        return { ...d, unmetDemand: [...map.values()] };
      });
    },

    setEnrollment(neighborhoodId, month, enrolled) {
      update((d) => ({
        ...d,
        enrollment: [
          ...d.enrollment.filter((e) => !(e.neighborhoodId === neighborhoodId && e.month === month)),
          { neighborhoodId, month, enrolled },
        ],
      }));
    },

    setSeed(seed) {
      set({ seed, seedFromHq: true });
    },

    markPackageSent(hash) {
      set({ lastPackage: { hash, at: new Date().toISOString() } });
    },

    loadDemo() {
      set({ data: buildDemoAuthority(), isDemo: true, lastPackage: undefined });
    },

    reset() {
      set({ data: emptyData(), isDemo: false, lastPackage: undefined, seed: defaultSeed, seedFromHq: false });
    },
  };
});

function upsert<T>(list: T[], item: T, key: (x: T) => string): T[] {
  const k = key(item);
  const i = list.findIndex((x) => key(x) === k);
  if (i === -1) return [...list, item];
  const copy = [...list];
  copy[i] = item;
  return copy;
}

// שמירה אוטומטית אחרי כל שינוי, מקובצת ל-300ms.
let timer: ReturnType<typeof setTimeout> | undefined;
useField.subscribe((state) => {
  if (!state.hydrated || !kv) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    const persisted: Persisted = {
      data: state.data,
      isDemo: state.isDemo,
      lastPackage: state.lastPackage,
      ...(state.seedFromHq ? { seed: state.seed } : {}),
    };
    void kv?.set(KEY, persisted);
  }, 300);
});

export const newId = () => globalThis.crypto.randomUUID();

/** קוד ספק חדש, ייחודי ברשות: S-001, S-002... */
export function nextSupplierCode(suppliers: readonly Supplier[]): string {
  const max = suppliers.reduce((m, s) => {
    const n = /^S-(\d+)$/.exec(s.code);
    return n ? Math.max(m, Number(n[1])) : m;
  }, 0);
  return `S-${String(max + 1).padStart(3, "0")}`;
}

/** החודש האחרון שיש בו פעילות, או החודש הנוכחי. */
export function latestMonth(activity: readonly MonthlyActivity[]): string {
  const months = activity.map((a) => a.month).sort();
  return months[months.length - 1] ?? new Date().toISOString().slice(0, 7);
}
