// מצב משטח המטה: החבילות שאוחדו, ה-seed הפעיל ויומן השינויים שעוד לא פורסמו.
// נשמר בדפדפן בלבד. פרטי ספקים יחידים נשמרים כאן ולא נכנסים לשום ייצוא.

import { create } from "zustand";
import {
  buildDemoAuthority,
  buildDemoNationalChannel,
  NATIONAL_AUTHORITY,
  buildPilotPackage,
  defaultSeed,
  emptyHqState,
  mergePackage,
  openStore,
  parseSeed,
  upgradeSeed,
  publishSeedVersion,
  settingsSchema,
  type ChangeLogEntry,
  type HqState,
  type KeyValueStore,
  type PilotPackage,
  type Seed,
  type Service,
  type Settings,
  type Supplier,
  DEMO_VARIANT_COUNT,
} from "@sal-ishi/core";
import { EDITION } from "@sal-ishi/ui";

type ServiceType = Seed["service_types"][number];

interface Persisted {
  state: HqState;
  seed: unknown;
  pending: ChangeLogEntry[];
  isDemo: boolean;
}

export interface HqStore {
  hydrated: boolean;
  state: HqState;
  seed: Seed;
  pending: ChangeLogEntry[];
  isDemo: boolean;

  hydrate(): Promise<void>;
  merge(pkg: PilotPackage): void;
  loadDemo(): Promise<void>;
  reset(): void;
  updateSetting(key: string, value: unknown, note?: string): string | null;
  updateServiceType(id: string, patch: Partial<ServiceType>): void;
  addServiceType(type: ServiceType): void;
  upsertNationalService(s: Service): void;
  upsertNationalSupplier(s: Supplier): void;
  publishSeed(): Seed;
}

let kv: KeyValueStore | null = null;
const KEY = "hq-state";

async function demoState(): Promise<HqState> {
  let state = emptyHqState();
  for (let v = 0; v < DEMO_VARIANT_COUNT; v++) state = mergePackage(state, await buildPilotPackage(buildDemoAuthority(v), defaultSeed));
  // ערוץ המוצרים הארצי מנוהל במטה, ולא מגיע בחבילות.
  const national = buildDemoNationalChannel();
  return { ...state, suppliers: [...state.suppliers, ...national.suppliers], services: [...state.services, ...national.services] };
}

const upsertBy = <T,>(list: T[], item: T, same: (a: T) => boolean) =>
  list.some(same) ? list.map((x) => (same(x) ? item : x)) : [...list, item];

export const useHq = create<HqStore>()((set, get) => {
  const log = (entry: Omit<ChangeLogEntry, "at">) =>
    set((s) => ({ pending: [...s.pending, { ...entry, at: new Date().toISOString() }] }));

  return {
    hydrated: false,
    state: emptyHqState(),
    seed: defaultSeed,
    pending: [],
    isDemo: false,

    async hydrate() {
      kv = await openStore("sal-ishi-hq");
      const saved = await kv.get<Persisted>(KEY);
      if (saved) {
        let seed = defaultSeed;
        try {
          seed = upgradeSeed(parseSeed(saved.seed));
        } catch {
          /* seed שמור לא תקין: חוזרים לברירת המחדל */
        }
        set({ state: saved.state, seed, pending: saved.pending ?? [], isDemo: saved.isDemo });
      } else if (EDITION === "preview") {
        set({ state: await demoState(), isDemo: true });
      }
      set({ hydrated: true });
    },

    merge(pkg) {
      set((s) => ({ state: mergePackage(s.state, pkg) }));
    },

    async loadDemo() {
      set({ state: await demoState(), isDemo: true });
    },

    reset() {
      set({ state: emptyHqState(), seed: defaultSeed, pending: [], isDemo: false });
    },

    updateSetting(key, value, note) {
      const { seed } = get();
      const before = (seed.settings as Record<string, unknown>)[key];
      const parsed = settingsSchema.safeParse({ ...seed.settings, [key]: value });
      if (!parsed.success) return parsed.error.issues[0]?.message ?? "ערך לא תקין";
      if (JSON.stringify(before) === JSON.stringify(value)) return null;
      set({ seed: { ...seed, settings: parsed.data as Settings } });
      log({ kind: "setting", key, before, after: value, ...(note ? { note } : {}) });
      return null;
    },

    updateServiceType(id, patch) {
      const { seed } = get();
      const before = seed.service_types.find((t) => t.id === id);
      if (!before) return;
      const after = { ...before, ...patch };
      set({ seed: { ...seed, service_types: seed.service_types.map((t) => (t.id === id ? after : t)) } });
      log({ kind: "service_type", key: id, before, after });
    },

    addServiceType(type) {
      const { seed } = get();
      set({ seed: { ...seed, service_types: [...seed.service_types, type] } });
      log({ kind: "service_type", key: type.id, before: null, after: type });
    },

    upsertNationalService(s) {
      const item: Service = { ...s, authority: NATIONAL_AUTHORITY, neighborhoodId: "", reach: "national" };
      set((st) => ({ state: { ...st.state, services: upsertBy(st.state.services, item, (x) => x.id === item.id) } }));
    },

    upsertNationalSupplier(s) {
      const item: Supplier = { ...s, authority: NATIONAL_AUTHORITY };
      set((st) => ({
        state: { ...st.state, suppliers: upsertBy(st.state.suppliers, item, (x) => x.authority === NATIONAL_AUTHORITY && x.code === item.code) },
      }));
    },

    publishSeed() {
      const { seed, pending } = get();
      const published = publishSeedVersion(seed, pending);
      set({ seed: published, pending: [] });
      return published;
    },
  };
});

let timer: ReturnType<typeof setTimeout> | undefined;
useHq.subscribe((s) => {
  if (!s.hydrated || !kv) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    const persisted: Persisted = { state: s.state, seed: s.seed, pending: s.pending, isDemo: s.isDemo };
    void kv?.set(KEY, persisted);
  }, 300);
});
