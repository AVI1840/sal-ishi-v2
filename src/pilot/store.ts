/**
 * המצב של חוויית האזרח והמלווה: נשמר במכשיר (localStorage), מסתנכרן בין
 * לשוניות פתוחות (האזרחית והמלווה באותו מכשיר בהדגמה), ונשלח לספק דרך
 * PilotSyncAdapter כשיש רשת. בלי שרת.
 */

import { useSyncExternalStore } from "react";
import { EMPTY_SIMULATION, derive, type Actor, type Derived, type Lang, type OnBehalf, type PilotEvent, type PilotState, type RequestKind, type Simulation, type VisitKind } from "./model";

/** מפתח נפרד מ-0.4: הגרסאות חולקות מקור באותו אתר, ו-0.5 לא כותב על הנתונים של 0.4. */
export const STORAGE_KEY = "sal-ishi-pilot-v05";

const INITIAL: PilotState = { schema: 1, events: [], simulation: EMPTY_SIMULATION, lang: "he", textScale: 1 };

function load(): PilotState {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return INITIAL;
    const parsed = JSON.parse(raw) as Partial<PilotState>;
    if (parsed.schema !== 1 || !Array.isArray(parsed.events)) return INITIAL;
    return { ...INITIAL, ...parsed, simulation: { ...EMPTY_SIMULATION, ...parsed.simulation } };
  } catch {
    return INITIAL;
  }
}

let state: PilotState = load();
let derived: Derived = derive(state.events);
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* אחסון חסום: ממשיכים בזיכרון */
  }
}

function emit() {
  derived = derive(state.events);
  listeners.forEach((l) => l());
}

function set(next: PilotState) {
  state = next;
  persist();
  emit();
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    state = load();
    emit();
  });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function usePilot(): { state: PilotState; derived: Derived } {
  const s = useSyncExternalStore(subscribe, () => state);
  const d = useSyncExternalStore(subscribe, () => derived);
  return { state: s, derived: d };
}

export const getPilot = () => ({ state, derived });

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

type NewEvent = PilotEvent extends infer E ? (E extends PilotEvent ? Omit<E, "id" | "at" | "synced"> : never) : never;

export function record(e: NewEvent): PilotEvent {
  const full = { ...e, id: newId("ev"), at: new Date().toISOString(), synced: false } as PilotEvent;
  set({ ...state, events: [...state.events, full] });
  return full;
}

// ── פעולות ────────────────────────────────────────────────

export function book(p: {
  citizenId: string;
  serviceId: string;
  serviceName: string;
  slot: string | null;
  coveredShekel: number;
  copayShekel: number;
  actor: Actor;
  onBehalf?: OnBehalf;
}): string {
  const bookingId = newId("bk");
  record({ type: "booking.created", bookingId, ...p });
  return bookingId;
}

export function cancelBooking(p: { citizenId: string; bookingId: string; charged: boolean; reason: string; actor: Actor; onBehalf?: OnBehalf }) {
  record({ type: "booking.cancelled", ...p });
}

export function createRequest(p: { citizenId: string; kind: RequestKind; serviceId?: string; serviceName?: string; note?: string; actor: Actor }): string {
  const requestId = newId("rq");
  record({ type: "request.created", requestId, ...p });
  return requestId;
}

export function decideRequest(p: { citizenId: string; requestId: string; decision: "approved" | "rejected" | "done"; reason: string }) {
  record({ type: "request.decided", actor: "companion", ...p });
}

export function logVisit(p: { citizenId: string; kind: VisitKind; note?: string }) {
  record({ type: "visit.logged", actor: "companion", visitId: newId("vs"), ...p });
}

export function setHospitalized(citizenId: string, on: boolean, note?: string) {
  if (on) record({ type: "hospitalization.started", actor: "companion", citizenId, note });
  else record({ type: "hospitalization.ended", actor: "companion", citizenId });
}

export function updateInterests(citizenId: string, interests: string[], actor: Actor) {
  record({ type: "needs.updated", actor, citizenId, interests });
}

export function setSimulation(patch: Partial<Simulation>) {
  set({ ...state, simulation: { ...state.simulation, ...patch } });
}

export function setLang(lang: Lang) {
  set({ ...state, lang });
}

export function setTextScale(textScale: PilotState["textScale"]) {
  set({ ...state, textScale });
}

/** אירועים שעוד לא נשלחו לספק. */
export const pendingSync = (s: PilotState = state) => s.events.filter((e) => !e.synced);

export function markSynced(ids: string[]) {
  const set_ = new Set(ids);
  set({ ...state, events: state.events.map((e) => (set_.has(e.id) ? { ...e, synced: true } : e)) });
}

/** מחליף את כל האירועים (נקודת ההתחלה של ההדגמה). */
export function replaceEvents(events: PilotEvent[], seeded: boolean) {
  set({ ...state, events, seeded });
}

/** איפוס ההדגמה: מוחק רק את נתוני 0.5 במכשיר הזה. */
export function resetPilot() {
  set({ ...INITIAL, lang: state.lang, textScale: state.textScale });
}
