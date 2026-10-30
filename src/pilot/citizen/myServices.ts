/**
 * "השירותים שלי": המפגש הבא של כל הצטרפות, ותזכורות. הכל נגזר מההזמנות שביומן
 * האירועים, בלי מצבים חדשים. תזכורת היא העדפה של המכשיר (localStorage): היא
 * מוצגת באפליקציה ביום שלפני ואפשר להוסיף את המפגש ליומן בטלפון. שליחת SMS אינה
 * חלק מההדגמה.
 */
import { useCallback, useEffect, useState } from "react";
import type { Booking } from "@/pilot/model";

const DAY = 24 * 60 * 60 * 1000;
const KEY = "sal-ishi-reminders";

/** המפגש הבא: חד-פעמי, המועד עצמו אם עוד לא עבר. מנוי, אותו יום ושעה בשבוע הקרוב. */
export function nextSession(b: Booking, now = new Date()): Date | null {
  if (!b.slot || b.status !== "booked") return null;
  const first = new Date(b.slot);
  if (b.mode !== "subscription") return first.getTime() >= now.getTime() ? first : null;
  if (first.getTime() >= now.getTime()) return first;
  const weeks = Math.ceil((now.getTime() - first.getTime()) / (7 * DAY));
  return new Date(first.getTime() + weeks * 7 * DAY);
}

/** תוך כמה זמן, במילים: היום, מחר, או בעוד כמה ימים. */
export function whenWords(d: Date, now = new Date()): string {
  const days = Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / DAY);
  return days <= 0 ? "היום" : days === 1 ? "מחר" : `בעוד ${days} ימים`;
}

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();

export function useReminders(): [Set<string>, (bookingId: string) => void] {
  const [ids, setIds] = useState<string[]>(read);
  useEffect(() => {
    const on = () => setIds(read());
    listeners.add(on);
    return () => void listeners.delete(on);
  }, []);
  const toggle = useCallback((bookingId: string) => {
    const cur = read();
    const next = cur.includes(bookingId) ? cur.filter((x) => x !== bookingId) : [...cur, bookingId];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* אחסון חסום: התזכורת תחזיק עד רענון */
    }
    setIds(next);
    listeners.forEach((l) => l());
  }, []);
  return [new Set(ids), toggle];
}

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** קובץ יומן (ics) למפגש, עם התראה יום לפני. נוצר במכשיר, בלי שרת. */
export function icsHref(title: string, where: string, start: Date, weekly: boolean): string {
  const end = new Date(start.getTime() + 90 * 60 * 1000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//sal-ishi//he",
    "BEGIN:VEVENT",
    `UID:${icsDate(start)}-${encodeURIComponent(title)}@sal-ishi`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    ...(weekly ? ["RRULE:FREQ=WEEKLY"] : []),
    `SUMMARY:${title}`,
    `LOCATION:${where}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${title}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}
