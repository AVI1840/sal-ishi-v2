import type { Lang } from "../model";
import { usePilot } from "../store";
import { ar } from "./ar";
import { he, type Strings } from "./he";
import { ru } from "./ru";

export const STRINGS: Record<Lang, Strings> = { he, ar, ru };
export const LANG_META: Record<Lang, { label: string; dir: "rtl" | "ltr"; speech: string; draft: boolean }> = {
  he: { label: "עברית", dir: "rtl", speech: "he-IL", draft: false },
  ar: { label: "العربية", dir: "rtl", speech: "ar-SA", draft: true },
  ru: { label: "Русский", dir: "ltr", speech: "ru-RU", draft: true },
};

export function useT(): { t: Strings; lang: Lang } {
  const { state } = usePilot();
  return { t: STRINGS[state.lang] ?? he, lang: state.lang };
}

export function formatSlot(t: Strings, iso: string): string {
  const d = new Date(iso);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return t.dateLine(t.weekdays[d.getDay()], d.getDate(), t.monthNames[d.getMonth()], time);
}
