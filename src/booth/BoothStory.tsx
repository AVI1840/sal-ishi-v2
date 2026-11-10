/**
 * שלושה דפי דוכן שמספרים את החוט: השבוע של שרה (לפני ואחרי הבחירה של המבקר), מי עבד על הבחירה
 * (הסוכנים, בכנות: מה פועל היום), ומה קיים ומה בדרך. אין כאן נתונים חדשים: הכל מהמוצר ומהתוכן.
 */
import { Link } from "react-router-dom";
import { CheckCircle2, Clock } from "lucide-react";
import { appSettings } from "@/pilot/settings";
import { usePilot } from "@/pilot/store";
import { awaitsSupplier } from "@/pilot/services";
import type { Booking } from "@/pilot/model";
import { useBooth } from "./store";
import { Page } from "./BoothPanels";
import "./booth-story.css";
import { AGENT_STORY, READY } from "./content";

const DAY = 86400000;

/** המועד של הצטרפות בשבוע הקרוב: חד-פעמי במועדו, מנוי באותו יום ושעה בשבוע. */
function occurrence(b: Booking, now: Date): Date | null {
  if (!b.slot) return null;
  const first = new Date(b.slot);
  if (b.mode !== "subscription" || first.getTime() >= now.getTime()) return first;
  return new Date(first.getTime() + Math.ceil((now.getTime() - first.getTime()) / (7 * DAY)) * 7 * DAY);
}

const dayName = (d: Date) => d.toLocaleDateString("he-IL", { weekday: "long" });
const timeOf = (d: Date) => d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", hour12: false });
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

interface Entry {
  id: string;
  name: string;
  at: Date;
  fresh: boolean;
  pending: boolean;
}

function Week({ title, entries, days, tone }: { title: string; entries: Entry[]; days: Date[]; tone: "before" | "after" }) {
  const now = new Date();
  return (
    <section aria-labelledby={`week-${tone}`} className={tone === "after" ? "booth-week booth-week--after" : "booth-week"}>
      <h2 id={`week-${tone}`} className="text-2xl font-extrabold text-[#1B3A5C]">{title}</h2>
      <p className="rounded-xl bg-[#eef3f8] px-3 py-1 text-base font-bold text-[#1B3A5C]">כל השבוע: סיוע בבית, מהגמלה</p>
      <ol className="space-y-1.5">
        {days.map((d, i) => {
          const items = entries.filter((e) => sameDay(e.at, d));
          return (
            <li key={i} className="grid grid-cols-[5rem_1fr] items-center gap-2 text-lg">
              <span className="font-bold text-[#4b5563]">{sameDay(d, now) ? "היום" : dayName(d)}</span>
              <span className="flex flex-wrap gap-2">
                {items.length === 0 ? <span className="text-[#6b7280]" aria-label="אין פעילות">-</span> : null}
                {items.map((e) => (
                  <span key={e.id} className={e.fresh ? "booth-week__new" : "rounded-full bg-white border-2 border-[#e5e7eb] px-3 py-0.5 font-bold"}>
                    {e.fresh ? <CheckCircle2 className="inline w-5 h-5 ml-1" aria-hidden="true" /> : null}
                    {e.name}, {timeOf(e.at)}
                    {e.fresh ? " · הבחירה שלכם" : ""}
                    {e.fresh && e.pending ? " · ממתין לאישור הספק" : ""}
                  </span>
                ))}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function BoothWeek() {
  const { derived } = usePilot();
  const { baseline } = useBooth();
  const now = new Date();
  const all: Entry[] = derived.bookings
    .filter((b) => b.citizenId === appSettings.citizen.persona_id && b.status === "booked")
    .flatMap((b) => {
      const at = occurrence(b, now);
      return at ? [{ id: b.id, name: b.serviceName, at, fresh: !baseline.includes(b.id), pending: awaitsSupplier(b) }] : [];
    });
  const before = all.filter((e) => !e.fresh);
  const hasNew = all.some((e) => e.fresh);
  // רק הימים שיש בהם פעילות, כדי שהשינוי יראה בלי גלילה.
  const week = Array.from({ length: 7 }, (_, i) => new Date(now.getTime() + i * DAY));
  const days = week.filter((d) => all.some((e) => sameDay(e.at, d)));
  const shown = days.length ? days : week.slice(0, 1);
  return (
    <Page>
      <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1B3A5C]">השבוע של שרה</h1>
      {hasNew ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Week title="לפני" entries={before} days={shown} tone="before" />
          <Week title="אחרי הבחירה שלכם" entries={all} days={shown} tone="after" />
        </div>
      ) : (
        <div className="space-y-4">
          <Week title="השבוע עכשיו" entries={before} days={shown} tone="before" />
          <p className="text-xl">בחרו שירות לשרה, וראו איך השבוע שלה משתנה.</p>
          <Link to="/citizen" className="inline-flex items-center rounded-full bg-[#1B3A5C] px-8 text-xl font-bold text-white min-h-[56px]">לשוק של שרה</Link>
        </div>
      )}
    </Page>
  );
}

export function BoothAgents() {
  const { picked } = useBooth();
  const pick = picked ?? "שירות שמתאים לה";
  return (
    <Page>
      <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1B3A5C]">מי עבד על הבחירה הזו</h1>
      <ol className="space-y-3">
        {AGENT_STORY.map((a, i) => (
          <li key={a.name} className="booth-agent rounded-3xl bg-white border-2 border-[#e5e7eb] shadow-sm p-4 flex flex-wrap items-center gap-3" style={{ animationDelay: `${i * 250}ms` }}>
            <span className="grid place-items-center w-10 h-10 rounded-full bg-[#1B3A5C] text-white text-xl font-black" aria-hidden="true">{i + 1}</span>
            <span className="flex-1 min-w-[12rem]">
              <span className="block text-xl font-extrabold text-[#1B3A5C]">{a.name}</span>
              <span className="block text-lg">{a.line(pick)}</span>
            </span>
            <span className="rounded-full bg-[#eef3f8] px-4 py-1 text-base font-bold text-[#1B3A5C]">{a.status}</span>
          </li>
        ))}
      </ol>
      <p className="rounded-2xl bg-[#eef3f8] p-4 text-lg font-bold text-[#1B3A5C]">
        הדמיה. היום רץ מנוע כללים שקוף. בפרודקשן: סוכני AI בפיקוח אדם. אף סוכן לא מחליט על זכאות, תקציב או גישה לשירות.
      </p>
    </Page>
  );
}

function Column({ title, items, Icon, tone }: { title: string; items: string[]; Icon: typeof Clock; tone: string }) {
  return (
    <section className={`rounded-3xl border-2 p-5 space-y-3 ${tone}`}>
      <h2 className="text-2xl font-extrabold text-[#1B3A5C]">{title}</h2>
      <ul className="space-y-2">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2 text-xl font-bold">
            <Icon className="w-6 h-6 mt-1 shrink-0 text-[#2d5a8c]" aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BoothReady() {
  return (
    <Page>
      <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1B3A5C]">מה קיים ומה בדרך</h1>
      <div className="grid gap-5 md:grid-cols-2">
        <Column title="קיים היום" items={READY.exists} Icon={CheckCircle2} tone="bg-white border-[#e5e7eb]" />
        <Column title="בדרך, עם שותפים" items={READY.coming} Icon={Clock} tone="bg-[#eef3f8] border-[#cfdcea]" />
      </div>
    </Page>
  );
}
