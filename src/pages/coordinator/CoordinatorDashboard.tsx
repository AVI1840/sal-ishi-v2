/**
 * בית המלווה: מה לעשות היום, ומאיפה. מקור אחד לכל מספר: התיק (buildCaseload),
 * מיון "לפנות היום" לפי הכללים, ויומן האירועים. בלי מדדים בלי מקור, בלי
 * המלצות "AI" ובלי רשימת סיכון שנייה: שיטת תעדוף אחת.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BasketBreakdown } from "@/components/shared/BasketBreakdown";
import { CalendarCheck, ChevronLeft, Inbox, MapPinned, Users, Wallet } from "lucide-react";
import { TodayTriage } from "@/components/companion/TodayTriage";
import { NewInCaseload } from "@/components/companion/NewInCaseload";
import { buildCaseload, triage } from "@/pilot/caseload";
import { appSettings } from "@/pilot/settings";
import { usePilot } from "@/pilot/store";
import { catalogState } from "@/data/catalogSource";
import { communityFor } from "@/lib/community";
import { COMPANION_NEIGHBORHOOD } from "./CoordinatorCommunity";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "בוקר טוב" : h < 17 ? "צהריים טובים" : "ערב טוב";
};

function Stat(props: { icon: typeof Users; label: string; value: number | string; to?: string }) {
  const body = (
    <>
      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
        <props.icon className="w-4 h-4" aria-hidden="true" /> {props.label}
      </p>
      <p className="text-3xl font-bold text-foreground mt-1">{props.value}</p>
    </>
  );
  return props.to ? (
    <Link to={props.to} className="libi-card p-5 block hover:border-primary/40">{body}</Link>
  ) : (
    <div className="libi-card p-5">{body}</div>
  );
}

export default function CoordinatorDashboard() {
  const { derived } = usePilot();
  const people = useMemo(() => buildCaseload(), []);
  const items = useMemo(() => triage(people, derived), [people, derived]);
  const today = items.filter((i) => i.bucket === "today").length;
  const open = derived.requests.filter((r) => r.status === "open").length;
  const weekBookings = derived.bookings.filter((b) => b.status !== "cancelled" && Date.now() - new Date(b.createdAt).getTime() < 7 * 86400000).length;
  const community = useMemo(() => communityFor(COMPANION_NEIGHBORHOOD), []);
  const gaps = community?.categories.filter((c) => c.level !== "green").length ?? 0;
  // הרכב הסל מההגדרות (מפגש 2): ארנק אישי, ליווי, קהילה ותפעול.
  const s = catalogState.seed.settings as unknown as Record<"total" | "personal_wallet" | "companion" | "community" | "overhead", number>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting()}, {appSettings.companion.name}
        </h1>
        <p className="text-base text-muted-foreground mt-1">
          {people.length} אזרחים בתיק · {today} לפנות היום
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Users} label="אזרחים בתיק" value={people.length} to="/coordinator/patients" />
        <Stat icon={Inbox} label="בקשות פתוחות" value={open} />
        <Stat icon={CalendarCheck} label="הזמנות השבוע" value={weekBookings} />
        <Stat icon={MapPinned} label="שירותים בשכונה" value={community?.services ?? 0} to="/coordinator/community" />
      </div>

      {/* חוט הזהב: מה שאזרחים בתיק עשו עכשיו, עם פעולה מוצעת */}
      <NewInCaseload />

      {/* שיטת תעדוף אחת: לפי הכללים שבהגדרות */}
      <TodayTriage />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="libi-card p-5" aria-labelledby="comm-h">
          <div className="flex items-center justify-between mb-3">
            <h2 id="comm-h" className="text-base font-semibold text-foreground flex items-center gap-2">
              <MapPinned className="w-5 h-5 text-primary" aria-hidden="true" /> הקהילה שלי
            </h2>
            <Link to="/coordinator/community" className="min-h-[44px] inline-flex items-center gap-0.5 text-sm font-semibold text-primary">
              לכל השכונה <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          <p className="text-base text-foreground">
            {community?.services ?? 0} שירותים מאושרים ב{COMPANION_NEIGHBORHOOD}, ועוד {(community?.reachable ?? 0) - (community?.services ?? 0)} ארציים ומרחוק. {gaps === 0 ? "כל תחומי הליבה עומדים ברצפה." : `${gaps} תחומים מתחת לרצפה, עם חלופות.`}
          </p>
          <ul className="mt-3 space-y-1.5">
            {community?.categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{c.name}</span>
                <span className="text-muted-foreground">{c.count} נספרים ברצפה</span>
              </li>
            ))}
          </ul>
        </section>

        <BasketBreakdown headingId="basket-h" />
      </div>
    </div>
  );
}
