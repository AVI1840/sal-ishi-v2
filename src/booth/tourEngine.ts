/**
 * מנוע הסיורים: מגדיר תחנה (מסך, אלמנט להארה, ומה מקדם אותה) ומאתר אלמנטים במסכים
 * האמיתיים של המוצר לפי טקסט או CSS, כך שאין צורך לשנות את הרכיבים עצמם.
 */

export interface Finder {
  css?: string;
  text?: RegExp;
}

export interface Step {
  title: string | (() => string);
  text: string | (() => string);
  /** המסך של התחנה. אם המבקר כבר במסך אחר, הסיור עובר אליו. */
  route?: string;
  /** כרטיס מצומצם בלי טקסט: לדפי דוכן שמסבירים את עצמם, כדי לא לכסות אותם. */
  compact?: boolean;
  /** אלמנטים להארה, לפי סדר עדיפות. הראשון שנמצא (וזמין) מואר. */
  target?: Finder[];
  /** מה מקדם את התחנה: לחיצה של המבקר על אלמנט תואם, או מעבר לכתובת תואמת. */
  advance?: { click?: Finder[]; route?: RegExp };
  /** כפתור הדמיה בכרטיס (למשל "הספק מאשר"). */
  action?: { label: string; run: () => void; show?: () => boolean };
}

const INTERACTIVE = "button, a, label, [role='tab'], [role='button'], summary";
const GENERIC = `${INTERACTIVE}, h1, h2, h3, h4, p, span, div, li`;

function visible(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return false;
  return getComputedStyle(el).visibility !== "hidden";
}

const inTour = (el: Element) => !!el.closest("[data-booth-tour]");

function textOf(el: HTMLElement): string {
  return (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
}

export function resolveFinder(f: Finder): HTMLElement | null {
  const root = document.getElementById("root") ?? document.body;
  const all = Array.from(root.querySelectorAll<HTMLElement>(f.css ?? GENERIC)).filter((e) => !inTour(e) && visible(e));
  let cands = all;
  if (f.text) {
    const re = f.text;
    cands = all.filter((e) => re.test(textOf(e)));
    if (!f.css) cands = cands.filter((e) => e.matches(INTERACTIVE) || !Array.from(e.children).some((c) => re.test(textOf(c as HTMLElement))));
  }
  return cands.find((e) => !(e instanceof HTMLButtonElement && e.disabled) && e.getAttribute("aria-disabled") !== "true") ?? null;
}

export function resolveTarget(fs?: Finder[]): HTMLElement | null {
  for (const f of fs ?? []) {
    const el = resolveFinder(f);
    if (el) return el;
  }
  return null;
}

/** האם האלמנט שנלחץ תואם אחד המאתרים. */
export function matchesAny(el: Element | null, fs?: Finder[]): boolean {
  if (!el || !fs) return false;
  const hit = el.closest<HTMLElement>(INTERACTIVE);
  if (!hit) return false;
  return fs.some((f) => (f.css ? hit.matches(f.css) : true) && (f.text ? f.text.test(textOf(hit)) : true));
}
