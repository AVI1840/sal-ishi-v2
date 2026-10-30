/**
 * CitizenServices: השוק בשכונה. כל שירות מאושר שמגיע לשכונה של האזרחית, מהאטלס
 * (אותו קטלוג שהמלווה והמטה רואים): מה, מי מפעיל, איפה, מתי, וכמה זה עולה
 * מהארנק. קודם מה שמתאים למה שסיפרה, אחר כך לפי תחום.
 *
 * בלי דירוג ספקים (אצל ספק העל) ובלי "מומלץ לפי דירוג". בלי ציונים.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Clock, MapPin, Search, Sparkles, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RealService } from "@/data/realServices";
import { catalogState } from "@/data/catalogSource";
import { getServiceImageInfo } from "@/lib/serviceImages";
import { useShowImages } from "@/hooks/use-visual-mode";
import { matchServicesForCitizen } from "@/lib/matchingEngine";
import { personalRecommendations } from "@/lib/personalMatch";
import { amount } from "@/lib/wallet";
import { formatSlot } from "@/pilot/i18n";
import { he } from "@/pilot/i18n/he";
import { usePilot } from "@/pilot/store";
import { isCoordinated, isProduct, priceOf, servicesFor, slotsFor } from "@/pilot/services";
import { whereText } from "@/pilot/citizen/Service";
import { usePersonalProfile, useWallet } from "@/pilot/citizen/common";

const QOL = "qol";

function domainOf(s: RealService): string {
  return s.coreCategoryId ?? QOL;
}

function priceText(s: RealService): string {
  const p = priceOf(s);
  if (p.state === "full") return `${p.funder ?? he.otherFunder} מממן`;
  if (p.unknown) return "המחיר בבדיקה";
  return p.copay === 0 ? amount(p.covered) : `${amount(p.covered)} + ₪${p.copay} ממך`;
}

function whenText(s: RealService): string | null {
  if (isProduct(s)) return null;
  const slots = slotsFor(s);
  return isCoordinated(s) || slots.length === 0 ? he.coordinated : formatSlot(he, slots[0]);
}

function ServiceCard({ service, reason }: { service: RealService; reason?: string }) {
  const showImages = useShowImages();
  const { image, gradient } = showImages ? getServiceImageInfo(service) : { image: undefined, gradient: "" };
  const when = whenText(service);
  return (
    <li>
      <Link
        to={`/citizen/services/${service.id}`}
        className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-[#1B3A5C]/30 hover:shadow-sm transition-all"
      >
        {showImages ? (
          <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
            {image ? <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" /> : <div className={cn("w-full h-full", gradient)} />}
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-gray-900 leading-tight">{service.name}</h3>
            <span className="shrink-0 text-sm px-2 py-0.5 rounded-lg font-semibold bg-blue-50 text-[#1B3A5C]">{priceText(service)}</span>
          </div>
          {reason ? (
            <p className="text-sm text-[#1B3A5C] font-medium mt-1 flex items-start gap-1">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" /> {reason}
            </p>
          ) : null}
          <p className="text-sm text-gray-700 mt-1 flex items-center gap-1">
            <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" /> {whereText(he, service)}
            <span className="text-gray-500" aria-hidden="true">·</span> {service.provider}
          </p>
          {when ? (
            <p className="text-sm text-gray-700 mt-0.5 flex items-center gap-1">
              <Clock className="w-4 h-4 shrink-0" aria-hidden="true" /> {when}
            </p>
          ) : null}
          {service.gatedByCompanion ? (
            <p className="text-sm text-violet-900 mt-1 flex items-center gap-1">
              <UserCheck className="w-4 h-4 shrink-0" aria-hidden="true" /> נפתח יחד עם המלווה
            </p>
          ) : null}
        </div>
        <ChevronLeft className="w-5 h-5 text-gray-500 shrink-0 self-center" aria-hidden="true" />
      </Link>
    </li>
  );
}

export default function CitizenServices() {
  const { simulation } = usePilot().state;
  const profile = usePersonalProfile();
  const wallet = useWallet();
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<string>("all");

  const all = useMemo(() => servicesFor(profile.neighborhood), [profile.neighborhood]);
  const picks = useMemo(() => {
    const ids = new Set(all.map((s) => s.id));
    const results = matchServicesForCitizen(profile, { topN: 500, minScore: 0 }).filter((r) => ids.has(r.service.id));
    return personalRecommendations(profile, results, 3);
  }, [all, profile]);
  const reasonOf = new Map(picks.map((p) => [p.result.service.id, p.reason]));

  const domains = useMemo(() => {
    const present = new Set(all.map(domainOf));
    const core = catalogState.seed.core_categories.filter((c) => present.has(c.id)).map((c) => ({ id: c.id, name: c.name }));
    return present.has(QOL) ? [...core, { id: QOL, name: "איכות חיים" }] : core;
  }, [all]);

  const q = query.trim();
  const shown = all.filter((s) => (domain === "all" || domainOf(s) === domain) && (!q || s.name.includes(q) || (s.subcategory ?? "").includes(q)));
  const forYou = domain === "all" && !q ? shown.filter((s) => reasonOf.has(s.id)).sort((a, b) => [...reasonOf.keys()].indexOf(a.id) - [...reasonOf.keys()].indexOf(b.id)) : [];
  const rest = shown.filter((s) => !forYou.includes(s));
  const groups = domains.map((d) => ({ ...d, items: rest.filter((s) => domainOf(s) === d.id) })).filter((g) => g.items.length);

  if (simulation.noServices) {
    return (
      <main id="main" tabIndex={-1} className="px-6 pt-16 pb-6 space-y-3" dir="rtl">
        <h1 className="text-2xl font-bold text-gray-900">{he.noServicesTitle}</h1>
        <p className="text-base text-gray-800">{he.noServicesText}</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <div className="bg-[#1B3A5C] text-white px-6 pt-6 pb-6">
        <div className="flex items-center gap-2 mb-5">
          <Search className="w-5 h-5 text-white/80" aria-hidden="true" />
          <span className="text-base font-bold text-white">סל אישי</span>
        </div>
        <h1 className="text-3xl font-bold">השוק בשכונה שלך</h1>
        <p className="text-lg text-white/85 mt-1">
          {profile.neighborhood} · {all.length} שירותים מאושרים
        </p>
        <p className="text-base text-white/90 mt-2">נשארו בארנק שלך {amount(wallet.left)}</p>
      </div>

      <main id="main" tabIndex={-1} className="px-6 pt-5 pb-6 space-y-5" data-read>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" aria-hidden="true" />
          <input
            type="search"
            aria-label="חיפוש בשוק"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="למשל: שירה, הליכה, טלפון"
            className="w-full min-h-[52px] pr-11 pl-4 rounded-xl border border-gray-300 bg-white text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/30"
          />
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="תחום">
          {[{ id: "all", name: "הכל" }, ...domains].map((d) => (
            <button
              key={d.id}
              type="button"
              aria-pressed={domain === d.id}
              onClick={() => setDomain(d.id)}
              className={cn(
                "min-h-[44px] px-4 rounded-full text-base font-semibold border",
                domain === d.id ? "bg-[#1B3A5C] text-white border-[#1B3A5C]" : "bg-white text-gray-800 border-gray-300",
              )}
            >
              {d.name}
            </button>
          ))}
        </div>

        <p className="sr-only" role="status" aria-live="polite">{shown.length} שירותים</p>

        {forYou.length ? (
          <section aria-labelledby="foryou-h">
            <h2 id="foryou-h" className="text-xl font-bold text-gray-900 mb-3">בשבילך, לפי מה שסיפרת</h2>
            <ul className="space-y-3">
              {forYou.map((s) => <ServiceCard key={s.id} service={s} reason={reasonOf.get(s.id)} />)}
            </ul>
          </section>
        ) : null}

        {groups.map((g) => (
          <section key={g.id} aria-labelledby={`d-${g.id}`}>
            <h2 id={`d-${g.id}`} className="text-xl font-bold text-gray-900 mb-3">{g.name}</h2>
            <ul className="space-y-3">
              {g.items.map((s) => <ServiceCard key={s.id} service={s} />)}
            </ul>
          </section>
        ))}

        {shown.length === 0 ? <p className="text-base text-gray-800">לא מצאנו. אפשר לנסות מילה אחרת, או לבקש מהמלווה.</p> : null}
      </main>
    </div>
  );
}
