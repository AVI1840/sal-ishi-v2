/**
 * הקראה בקול (Web Speech API). כשאין תמיכה בדפדפן הכפתור לא מוצג, ושום
 * דבר אחר לא נשבר. מקריאים את הטקסט של אזור התוכן בלבד ([data-read]),
 * בלי סרגלי הניווט.
 */

import { useCallback, useEffect, useState } from "react";

export const speechSupported = () => typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";

function readableText(root: Element): string {
  const clone = root.cloneNode(true) as Element;
  clone.querySelectorAll("[data-no-read], svg, [aria-hidden='true']").forEach((n) => n.remove());
  return (clone as HTMLElement).innerText ?? clone.textContent ?? "";
}

export function useReadAloud(lang: string) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => {
    if (speechSupported()) window.speechSynthesis.cancel();
  }, []);

  const stop = useCallback(() => {
    if (!speechSupported()) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const read = useCallback(() => {
    if (!speechSupported()) return;
    const root = document.querySelector("[data-read]");
    if (!root) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(readableText(root).replace(/\s+/g, " ").trim());
    u.lang = lang;
    u.rate = 0.9;
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
    if (voice) u.voice = voice;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }, [lang]);

  return { speaking, read, stop, supported: speechSupported() };
}
