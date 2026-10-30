/**
 * CitizenServiceDetail: דף שירות בודד, שירות אמיתי מהקטלוג.
 *
 * 0.5 מאוחד: העלות בשקלים (מהסל וממך), השלמה למממן אחר (תוספת 3), כללי
 * הביטול, והזמנה בשלושה צעדים. שירות שנפתח באישור המלווה, אשפוז וסל ריק
 * מקבלים הסבר ודרך הלאה במקום כפתור.
 */
import { useParams, Link } from "react-router-dom";
import { useMemo, type ReactNode } from "react";
import { getServiceImageInfo } from "@/lib/serviceImages";
import { useShowImages } from "@/hooks/use-visual-mode";
import { ArrowRight, MapPin, Clock, Phone, Globe, AlertCircle, Heart, Activity, Users, Laptop, Wrench, Wallet, CalendarX, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { realServices } from "@/data/realServices";
import { matchServicesForCitizen } from "@/lib/matchingEngine";
import { citizenReasons } from "@/lib/citizenReasons";
import ServiceRating from "@/components/shared/ServiceRating";
import { BookingPanel } from "@/components/citizen/BookingPanel";
import { needsCompanion, termLines } from "@/lib/serviceTerms";
import { he } from "@/pilot/i18n/he";
import { createRequest, usePilot } from "@/pilot/store";
import { isProduct, priceOf } from "@/pilot/services";
import { complementLine, ruleText } from "@/pilot/citizen/Service";
import { reasonKey, useCitizen, useWallet } from "@/pilot/citizen/common";

const LANG_MAP: Record<string, string> = {
  hebrew: "עברית", arabic: "ערבית", russian: "רוסית", english: "אנגלית",
  yiddish: "יידיש", amharic: "אמהרית", french: "צרפתית", bukharian: "בוכרית",
};

const ACCESS_MAP: Record<string, string> = {
  wheelchair: "נגיש לכיסא גלגלים", transport: "הסעות", home_visit: "ביקורי בית",
  remote: "מרחוק / דיגיטלי", elevator: "מעלית", parking: "חניה", emergency_button: "כפתור חירום",
};

const CATEGORY_ICON: Record<number, typeof Heart> = {
  1: Heart, 2: Activity, 3: Users, 4: Laptop, 5: Wrench,
};

const actionPrimary = "w-full min-h-[52px] bg-[#1B3A5C] text-white rounded-xl text-lg font-bold hover:bg-[#15304d] transition-colors flex items-center justify-center gap-2";

function Notice(props: { children: ReactNode; tone?: "info" | "warning" }) {
  return (
    <div className={cn("flex items-start gap-2.5 p-4 rounded-xl border text-base", props.tone === "warning" ? "bg-amber-50 border-amber-200 text-amber-950" : "bg-blue-50 border-blue-200 text-gray-900")}>
      <Info className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
      <div>{props.children}</div>
    </div>
  );
}

export default function CitizenServiceDetail() {
  const { id } = useParams();
  const service = realServices.find((s) => s.id === id);
  const { derived } = usePilot();
  const { profile: citizen } = useCitizen();
  const wallet = useWallet();
  const showImages = useShowImages();

  const matchResult = useMemo(() => {
    if (!service) return null;
    const all = matchServicesForCitizen(citizen, { topN: 500, minScore: 0 });
    return all.find((r) => r.service.id === service.id) ?? null;
  }, [service, citizen]);

  if (!service) {
    return (
      <main id="main" tabIndex={-1} className="px-6 pt-16 pb-6 space-y-4" dir="rtl">
        <h1 className="text-2xl font-bold text-gray-900">השירות לא נמצא</h1>
        <p className="text-base text-gray-700">ייתכן שהוא כבר לא בקטלוג. אפשר לחפש שירות אחר, או לבקש מהמלווה.</p>
        <Link to="/citizen/services" className="flex items-center justify-center min-h-[52px] bg-[#1B3A5C] text-white rounded-xl text-lg font-bold">
          {he.findService}
        </Link>
      </main>
    );
  }
  const Icon = CATEGORY_ICON[service.category] ?? Heart;
  const imgInfo = getServiceImageInfo(service);

  // תנאי השירות בלי שורת הביטול: הביטול מוסבר בשפה פשוטה בכרטיס נפרד.
  const terms = termLines(service).filter((t) => t.term !== "ביטול" && t.term !== "אי-הגעה" && t.term !== "פתיחה");
  const reasons = citizenReasons(matchResult?.explanations ?? []).slice(0, 4);
  const price = priceOf(service);
  const complement = complementLine(he, price);
  const mine = (kind: string) => derived.requests.find((r) => r.citizenId === citizen.id && r.serviceId === service.id && r.kind === kind && (r.status === "open" || r.status === "approved"));
  const gateRequest = mine("gated_service");
  const gated = needsCompanion(service) && gateRequest?.status !== "approved";
  const hospitalized = derived.hospitalized.has(citizen.id);
  const tooExpensive = !price.unknown && price.covered > wallet.left;
  const needsClaim = price.state === "full" || price.state === "prior_claim" || price.state === "varies";
  const claimOpen = Boolean(mine("claim_help"));
  const booked = derived.bookings.some((b) => b.citizenId === citizen.id && b.serviceId === service.id && b.status !== "cancelled");

  return (
    <div className="min-h-screen bg-gray-50 pb-6" dir="rtl">

      {/* חזרה. שם השירות הוא הכותרת שבכרטיס הראשי, כי כלי הנגישות יושבים בפינה השמאלית העליונה */}
      <header className="sticky top-10 z-30 bg-white border-b border-gray-200 px-5 h-14 flex items-center">
        <Link to="/citizen/services" className="min-h-[44px] px-2 -mx-2 inline-flex items-center gap-1.5 text-base font-semibold text-[#1B3A5C]">
          <ArrowRight className="w-5 h-5" aria-hidden="true" /> לשירותים
        </Link>
      </header>

      <main id="main" tabIndex={-1} className="px-5 pt-5 space-y-4 max-w-3xl mx-auto" data-read>

        {/* Hero: תמונה במצב תמונות, כרטיס כחול במצב נקי */}
        {showImages ? (
          <div className="relative h-48 rounded-xl overflow-hidden">
            {imgInfo.image ? (
              <img src={imgInfo.image} alt={service.name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className={cn("w-full h-full", imgInfo.gradientDark)} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 right-0 left-0 p-5 flex items-end justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-white drop-shadow leading-tight">{service.name}</h1>
                <p className="text-sm text-white/90 mt-1">{service.provider}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="absolute top-3 right-3">
              <span className="text-[10px] px-2 py-1 rounded-lg bg-black/30 backdrop-blur text-white/80 font-medium">
                {service.categoryLabel}
              </span>
            </div>
          </div>
        ) : (
          /* Original clean hero card */
          <div className="bg-[#1B3A5C] rounded-xl p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">{service.name}</h1>
                <p className="text-sm text-white/90 mt-0.5">{service.provider}</p>
                <p className="text-xs text-white/80 mt-1">{service.categoryLabel}</p>
              </div>
            </div>
          </div>
        )}

        {/* כמה זה עולה: בשקלים, מהסל וממך, או השלמה למממן אחר */}
        <section aria-labelledby="cost-h" className="bg-white rounded-xl p-5 border border-gray-200 space-y-2">
          <h2 id="cost-h" className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#1B3A5C]" aria-hidden="true" /> {he.cost}
          </h2>
          <p className="text-base text-gray-900">
            {complement ?? (price.unknown ? he.costUnknown(price.total) : he.costLine(price.covered, price.copay))}
            {service.unit ? <span className="text-gray-600"> ({he.perUnit(service.unit)})</span> : null}
          </p>
          <p className="text-sm text-gray-700">נשארו בסל שלך החודש ₪{wallet.left} מתוך ₪{wallet.total}.</p>
        </section>

        {/* אם צריך לבטל */}
        {!isProduct(service) && (
          <section aria-labelledby="cancel-h" className="bg-white rounded-xl p-5 border border-gray-200 space-y-1">
            <h2 id="cancel-h" className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CalendarX className="w-5 h-5 text-[#1B3A5C]" aria-hidden="true" /> {he.cancelTitle}
            </h2>
            {ruleText(he, service).map((line) => (
              <p key={line} className="text-base text-gray-800">{line}</p>
            ))}
          </section>
        )}

        {/* תנאי השירות לפי מודל התשלום */}
        {terms.length > 0 && (
          <section aria-labelledby="terms-h" className="bg-white rounded-xl p-4 border border-gray-100">
            <h2 id="terms-h" className="text-sm font-semibold text-gray-700 mb-2">תנאי השירות</h2>
            <dl className="space-y-1.5">
              {terms.map((t) => (
                <div key={t.term} className="flex gap-3 text-sm">
                  <dt className="w-24 shrink-0 font-medium text-gray-700">{t.term}</dt>
                  <dd className="text-gray-700">{t.text}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Details: רק כשיש פרטים בקטלוג */}
        {(service.address || service.days || service.phone || service.website) && (
        <div className="bg-white rounded-xl p-5 border border-gray-100 space-y-3">
          {service.address && (
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
              <div><p className="text-xs text-gray-600">כתובת</p><p className="text-sm text-gray-800">{service.address}</p></div>
            </div>
          )}
          {service.days && (
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
              <div><p className="text-xs text-gray-600">ימים ושעות</p><p className="text-sm text-gray-800">{service.days}{service.hours && ` · ${service.hours}`}</p></div>
            </div>
          )}
          {service.phone && (
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
              <div><p className="text-xs text-gray-600">טלפון</p><a href={`tel:${service.phone}`} className="text-sm text-[#1B3A5C] hover:underline">{service.phone}</a></div>
            </div>
          )}
          {service.website && (
            <div className="flex items-start gap-2.5">
              <Globe className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
              <div><p className="text-xs text-gray-600">אתר</p><a href={`https://${service.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#1B3A5C] hover:underline">{service.website}</a></div>
            </div>
          )}
        </div>
        )}

        {/* למה זה מתאים לך: בשפת האזרח, בלי ציון ובלי נקודות */}
        <section aria-labelledby="why-h" className="bg-white rounded-xl p-5 border border-gray-200 space-y-2">
          <h2 id="why-h" className="text-lg font-bold text-gray-900">{he.reasonTitle}</h2>
          <ul className="space-y-1.5">
            {(reasons.length ? reasons : [he.reason[reasonKey(service)]]).map((r) => (
              <li key={r} className="flex items-start gap-2 text-base text-gray-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" /> {r}
              </li>
            ))}
          </ul>
        </section>

        {/* Languages */}
        {service.languages.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-2">שפות השירות</p>
            <div className="flex flex-wrap gap-2">
              {service.languages.map((lang) => (
                <span key={lang} className="text-xs px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-700">
                  {LANG_MAP[lang] ?? lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Accessibility */}
        {service.accessibility.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-2">נגישות</p>
            <div className="flex flex-wrap gap-2">
              {service.accessibility.map((a) => (
                <span key={a} className="text-xs px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-700">
                  {ACCESS_MAP[a] ?? a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {service.notes && (
          <div className="flex items-start gap-2.5 p-4 bg-white rounded-xl border border-gray-100">
            <AlertCircle className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-600">{service.notes}</p>
          </div>
        )}

        {/* דירוג: רק למי שכבר הזמינה את השירות */}
        {booked && <ServiceRating serviceId={service.id} serviceName={service.name} />}

        {/* מה אפשר לעשות עכשיו */}
        <div className="space-y-3 pt-2">
          {needsClaim && (
            claimOpen ? (
              <p role="status" className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-base text-emerald-900">{he.claimSent}</p>
            ) : (
              <button
                type="button"
                className={actionPrimary}
                onClick={() => createRequest({ citizenId: citizen.id, kind: "claim_help", serviceId: service.id, serviceName: service.name, note: price.funder ?? undefined, actor: "citizen" })}
              >
                {he.claimHelp}
              </button>
            )
          )}
          {price.state === "full" ? null : hospitalized ? (
            <Notice>{he.hospitalBlock}</Notice>
          ) : gated ? (
            <>
              <Notice>
                {he.gatedExplain}
                {service.gateReason ? ` (${service.gateReason})` : ""}
                {gateRequest ? <strong className="block mt-1">{he.status.open}</strong> : null}
              </Notice>
              {!gateRequest && (
                <button
                  type="button"
                  className={actionPrimary}
                  onClick={() => createRequest({ citizenId: citizen.id, kind: "gated_service", serviceId: service.id, serviceName: service.name, actor: "citizen" })}
                >
                  {he.askCompanion}
                </button>
              )}
            </>
          ) : tooExpensive ? (
            <Notice tone="warning">{he.notEnough}</Notice>
          ) : (
            <BookingPanel service={service} />
          )}
          {service.phone && (
            <a
              href={`tel:${service.phone}`}
              className="w-full min-h-[48px] bg-white border border-[#1B3A5C] text-[#1B3A5C] rounded-xl text-base font-semibold hover:bg-[#1B3A5C]/5 transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              להתקשר למפעיל: {service.phone}
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
