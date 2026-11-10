/**
 * הנגשה של הדוכן, בכל מסך שלו (לא רק במסכי האזרחית): גודל טקסט וניגודיות גבוהה, שנשמרים במכשיר
 * (קידומת booth:: של בידוד האחסון), ומצב קיוסק. הקיוסק (חזרה אוטומטית אחרי חוסר פעילות ובלי בחירת
 * טקסט) נדלק רק בכתובת עם kiosk=1, כלומר בדוכן הפיזי. בקישור שמשתפים הוא כבוי, כי טיימר שמאפס את המסך
 * פוגע במי שקורא לאט, ובמי שמשתמש בקורא מסך. הקובץ בלי תופעות לוואי בייבוא: init נקרא מהמעטפת.
 */
import { useSyncExternalStore } from "react";

export const SCALES = [100, 118, 137, 160] as const;
const KEY = "booth-a11y";
const KIOSK_KEY = "booth-kiosk";

interface A11y {
  scale: number;
  hc: boolean;
}

function read(): A11y {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    if (v && (SCALES as readonly number[]).includes(v.scale)) return { scale: v.scale, hc: !!v.hc };
  } catch {
    /* אחסון חסום או ערך פגום: ברירת מחדל */
  }
  return { scale: 100, hc: false };
}

let state: A11y = { scale: 100, hc: false };
const listeners = new Set<() => void>();

function apply() {
  const root = document.documentElement;
  root.style.setProperty("--booth-text", String(state.scale / 100));
  root.classList.toggle("hc", state.hc);
}

function set(next: Partial<A11y>) {
  state = { ...state, ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* אחסון חסום: ההעדפה תחזיק עד רענון */
  }
  apply();
  listeners.forEach((l) => l());
}

export const a11y = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  /** קורא את ההעדפות השמורות ומחיל אותן. נקרא פעם אחת, בעליית המעטפת. */
  init() {
    state = read();
    apply();
  },
  up() {
    const i = (SCALES as readonly number[]).indexOf(state.scale);
    if (i < SCALES.length - 1) set({ scale: SCALES[i + 1] });
  },
  down() {
    const i = (SCALES as readonly number[]).indexOf(state.scale);
    if (i > 0) set({ scale: SCALES[i - 1] });
  },
  toggleContrast() {
    set({ hc: !state.hc });
  },
  reset() {
    set({ scale: 100, hc: false });
  },
};

export function useA11y(): A11y {
  return useSyncExternalStore(a11y.subscribe, a11y.get, a11y.get);
}

/** קיוסק: נדלק בכתובת עם kiosk=1 ונשמר במכשיר, ונכבה עם kiosk=0. */
export function initKiosk(): boolean {
  let on = false;
  try {
    const m = /[?&]kiosk=([01])/.exec(window.location.hash + window.location.search);
    if (m) localStorage.setItem(KIOSK_KEY, m[1]);
    on = localStorage.getItem(KIOSK_KEY) === "1";
  } catch {
    on = false;
  }
  document.documentElement.toggleAttribute("data-kiosk", on);
  return on;
}
