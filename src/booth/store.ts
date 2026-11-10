/**
 * מצב הדוכן: איזה סיור פעיל, באיזו תחנה, והחוט שעובר בין שלוש המערכות (שרה, רונית, המטה).
 * בזיכרון בלבד (מתאפס עם האיפוס), חוץ ממצב המציג שנשמר ללשונית (sessionStorage).
 */
import { useSyncExternalStore } from "react";
import { createRequest } from "@/pilot/store";
import { appSettings } from "@/pilot/settings";
import { recordSince, type BoothPick } from "./dayBoard";

export type TourLens = "citizen" | "companion" | "hq" | "judges";
export type Act = "citizen" | "companion" | "hq";

/** סדר המערכות בחוט, מעגלי: נכנסים מכל דלת והחוט ממשיך הלאה. */
const CIRCLE: Act[] = ["citizen", "companion", "hq"];

export interface BoothState {
  presenter: boolean;
  lens: TourLens | null;
  step: number;
  /** הסיור שהסתיים לאחרונה (למסך הסיום). */
  last: TourLens | null;
  /** הבחירה של המבקר בסיור האזרחית: שם, תחום ומזהה הזמנה. */
  pick: BoothPick | null;
  /** שם השירות שנבחר (לניסוחים). */
  picked: string | null;
  /** הזמנות שהיו לפני תחילת החוט. */
  baseline: string[];
  /** המערכות שהמבקר עבר מאז האיפוס האחרון. */
  seen: TourLens[];
  /** סדר המערכות בחוט הנוכחי. */
  order: Act[];
  /** מזהה הבקשה של שרה אצל רונית, אם נוצרה. */
  requestId: string | null;
  /** הסיור המלא (הארוך) במקום המקוצר: רק במצב מציג. */
  full: boolean;
  done: boolean;
}

const PRESENTER_KEY = "booth-presenter";

function readPresenter(): boolean {
  try {
    return sessionStorage.getItem(PRESENTER_KEY) === "1";
  } catch {
    return false;
  }
}

const blank = (presenter: boolean): BoothState => ({
  presenter,
  lens: null,
  step: 0,
  last: null,
  pick: null,
  picked: null,
  baseline: [],
  seen: [],
  order: [],
  requestId: null,
  full: false,
  done: false,
});

let state: BoothState = blank(readPresenter());
const listeners = new Set<() => void>();

function set(next: Partial<BoothState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

/** מי הבא בחוט אחרי שהמערכת הנוכחית הסתיימה (או null אם הכל נראה, או שזה מסלול שופטים/סיור מלא). */
export function nextActOf(s: ActState): Act | null {
  if (s.full || s.lens === "judges" || !s.lens) return null;
  const seen = new Set<TourLens>([...s.seen, s.lens]);
  return s.order.find((a) => !seen.has(a)) ?? null;
}
type ActState = Pick<BoothState, "full" | "lens" | "seen" | "order">;

export const booth = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  /** חוט חדש מהדלת שנבחרה. */
  start(lens: TourLens, baseline: string[] = [], full = false) {
    const i = CIRCLE.indexOf(lens as Act);
    const order = lens === "judges" ? [] : [...CIRCLE.slice(i), ...CIRCLE.slice(0, i)];
    set({ ...blank(state.presenter), lens, order, baseline, full });
  },
  /** מעבר למערכת הבאה באותו חוט: הבחירה והבקשה נשמרות. */
  startAct(lens: Act) {
    set({ lens, step: 0, done: false });
  },
  goto(step: number) {
    set({ step: Math.max(0, step) });
  },
  /** סיום המערכת הנוכחית. אחרי מערכת האזרחית הבחירה נרשמת בלוח, ושרה "מבקשת" אצל רונית. */
  finish() {
    const lens = state.lens;
    let { pick, requestId } = state;
    if (lens === "citizen" && !pick) {
      pick = recordSince(state.baseline);
      if (pick && !requestId) {
        try {
          requestId = createRequest({
            citizenId: appSettings.citizen.persona_id,
            kind: "gated_service",
            serviceId: pick.serviceId,
            serviceName: pick.name,
            note: "נרשם בדוכן",
            actor: "citizen",
          });
        } catch {
          /* הבקשה אצל המלווה היא תוספת: בלעדיה הסיור ממשיך */
        }
      }
    }
    const seen = lens && !state.seen.includes(lens) ? [...state.seen, lens] : state.seen;
    set({ lens: null, step: 0, last: lens, pick, picked: pick?.name ?? state.picked, requestId, seen, done: true });
  },
  leave() {
    set({ lens: null, step: 0, done: false });
  },
  /** איפוס מלא למבקר הבא. מצב המציג נשמר. */
  reset() {
    set(blank(state.presenter));
  },
  togglePresenter() {
    const presenter = !state.presenter;
    try {
      sessionStorage.setItem(PRESENTER_KEY, presenter ? "1" : "0");
    } catch {
      /* אחסון חסום */
    }
    set({ presenter, full: presenter ? state.full : false });
  },
};

export function useBooth(): BoothState {
  return useSyncExternalStore(booth.subscribe, booth.get, booth.get);
}
