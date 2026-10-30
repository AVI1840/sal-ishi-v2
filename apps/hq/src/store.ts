// מצב משטח המטה: החבילות שאוחדו, ה-seed הפעיל ויומן השינויים שעוד לא פורסמו.
// נשמר בדפדפן בלבד. פרטי ספקים יחידים נשמרים כאן ולא נכנסים לשום ייצוא.

import { create } from "zustand";
import {
  buildDemoAuthority,
  buildDemoNationalChannel,
  NATIONAL_AUTHORITY,
  buildPilotPackage,
  defaultSeed,
  isOlderSeedBase,
  emptyHqState,
  mergePackage,
  openVersionedStore,
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

/** יומן ביקורת: כל שינוי במטה, בקטלוג ובכללים, עם זמן. לא נמחק בפרסום. */
export interface AuditEntry {
  at: string;
  action: "קליטת חבילה" | "נתוני הדגמה" | "איפוס" | "שינוי כלל" | "סוג שירות" | "ערוץ ארצי" | "פרסום גרסת כללים";
  detail: string;
}

interface Persisted {
  state: HqState;
  seed: unknown;
  pending: ChangeLogEntry[];
  isDemo: boolean;
  /** חדש ב-0.5. נתונים של 0.4 נטענים בלעדיו. */
  audit?: AuditEntry[];
}

export interface HqStore {
  hydrated: boolean;
  /** הודעה כשה-seed השמור היה מגרסת בסיס ישנה והוחלף במובנה. */
  seedNotice: string | null;
  dismissSeedNotice(): void;
  state: HqState;
  seed: Seed;
  pending: ChangeLogEntry[];
  isDemo: boolean;
  audit: AuditEntry[];

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

  const audit = (action: AuditEntry["action"], detail: string) =>
    set((s) => ({ audit: [...s.audit, { at: new Date().toISOString(), action, detail }] }));

  return {
    hydrated: false,
    audit: [],
    state: emptyHqState(),
    seed: defaultSeed,
    pending: [],
    isDemo: false,
    seedNotice: null,

    dismissSeedNotice() {
      set({ seedNotice: null });
    },

    async hydrate() {
      kv = (await openVersionedStore("sal-ishi-hq", [KEY])).store;
      const saved = await kv.get<Persisted>(KEY);
      if (saved) {
        let seed = defaultSeed;
        let seedNotice: string | null = null;
        let pending = saved.pending ?? [];
        if (isOlderSeedBase(saved.seed)) {
          // מבנה ההגדרות השתנה בין גרסאות הבסיס: עוברים ל-seed המובנה, ושינויים שלא פורסמו בגרסה הישנה לא חלים עליו.
          const from = (saved.seed as { meta?: { version?: string } } | null)?.meta?.version ?? "קודמת";
          seedNotice = `גרסת הכללים עודכנה מ-${from} ל-${defaultSeed.meta.version} (מודל התשלום של החשכ"ל). ערכים ששונו במטה בגרסה הקודמת הוחלפו בערכי ${defaultSeed.meta.version}, ויש לעדכן אותם מחדש בספרייה וכללים אם צריך.`;
          pending = [];
        } else {
          try {
            seed = upgradeSeed(saved.seed);
          } catch {
            /* seed שמור לא תקין: חוזרים לברירת המחדל */
          }
        }
        set({ state: saved.state, seed, pending, isDemo: saved.isDemo, seedNotice, audit: saved.audit ?? [] });
      } else if (EDITION === "preview") {
        set({ state: await demoState(), isDemo: true });
        audit("נתוני הדגמה", "נטענו נתוני ההדגמה הסינתטיים");
      }
      set({ hydrated: true });
    },

    merge(pkg) {
      set((s) => ({ state: mergePackage(s.state, pkg) }));
      audit("קליטת חבילה", `${pkg.authority}: ${pkg.services.length} שירותים, ${pkg.neighborhoods.length} שכונות`);
    },

    async loadDemo() {
      set({ state: await demoState(), isDemo: true });
      audit("נתוני הדגמה", "נטענו נתוני ההדגמה הסינתטיים");
    },

    reset() {
      set({ state: emptyHqState(), seed: defaultSeed, pending: [], isDemo: false });
      audit("איפוס", "המטה אופס: בלי חבילות, גרסת הכללים המובנית");
    },

    updateSetting(key, value, note) {
      const { seed } = get();
      const before = (seed.settings as Record<string, unknown>)[key];
      const parsed = settingsSchema.safeParse({ ...seed.settings, [key]: value });
      if (!parsed.success) return parsed.error.issues[0]?.message ?? "ערך לא תקין";
      if (JSON.stringify(before) === JSON.stringify(value)) return null;
      set({ seed: { ...seed, settings: parsed.data as Settings } });
      log({ kind: "setting", key, before, after: value, ...(note ? { note } : {}) });
      audit("שינוי כלל", `${key}${note ? `: ${note}` : ""}`);
      return null;
    },

    updateServiceType(id, patch) {
      const { seed } = get();
      const before = seed.service_types.find((t) => t.id === id);
      if (!before) return;
      const after = { ...before, ...patch };
      set({ seed: { ...seed, service_types: seed.service_types.map((t) => (t.id === id ? after : t)) } });
      log({ kind: "service_type", key: id, before, after });
      audit("סוג שירות", `עודכן ${id}`);
    },

    addServiceType(type) {
      const { seed } = get();
      set({ seed: { ...seed, service_types: [...seed.service_types, type] } });
      log({ kind: "service_type", key: type.id, before: null, after: type });
      audit("סוג שירות", `נוסף ${type.id}: ${type.name}`);
    },

    upsertNationalService(s) {
      const item: Service = { ...s, authority: NATIONAL_AUTHORITY, neighborhoodId: "", reach: "national" };
      set((st) => ({ state: { ...st.state, services: upsertBy(st.state.services, item, (x) => x.id === item.id) } }));
      audit("ערוץ ארצי", `שירות ${item.id}: ${item.name}`);
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
      audit("פרסום גרסת כללים", `גרסה ${published.meta.version}, ${pending.length} שינויים`);
      return published;
    },
  };
});

let timer: ReturnType<typeof setTimeout> | undefined;
useHq.subscribe((s) => {
  if (!s.hydrated || !kv) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    const persisted: Persisted = { state: s.state, seed: s.seed, pending: s.pending, isDemo: s.isDemo, audit: s.audit };
    void kv?.set(KEY, persisted);
  }, 300);
});
