import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Phone } from "lucide-react";
import { CITIZENS } from "@/data/mockData";
import type { RealService } from "@/data/realServices";
import type { PersonalProfile } from "@/data/types";
import { useT } from "../i18n";
import { appSettings } from "../settings";
import { usePilot } from "../store";
import { monthlyWalletShekel, spentThisMonth } from "../services";
import { withAnswers } from "@/lib/personalMatch";

/** האזרחית של ההדגמה, עם מה שסיפרה שחשוב לה. */
export function useCitizen(): { profile: PersonalProfile; firstName: string; interests: string[] } {
  const { derived } = usePilot();
  const profile = useMemo(() => CITIZENS.find((c) => c.id === appSettings.citizen.persona_id) ?? CITIZENS[0], []);
  return { profile, firstName: profile.name.split(" ")[0], interests: derived.interests.get(profile.id) ?? [] };
}

/** האזרחית עם מה שסיפרה בשאלון ("לספר מה חשוב לי") או בפגישה המשותפת. */
export function usePersonalProfile(): PersonalProfile {
  const { derived } = usePilot();
  const { profile } = useCitizen();
  const answers = derived.answers.get(profile.id);
  return useMemo(() => withAnswers(profile, answers), [profile, answers]);
}

export function useWallet() {
  const { state, derived } = usePilot();
  const { profile } = useCitizen();
  const total = monthlyWalletShekel();
  const baseline = state.simulation.walletEmpty ? total : appSettings.citizen.baseline_spent_this_month;
  const used = Math.min(total, spentThisMonth(derived.bookings, profile.id, baseline));
  return { total, used, left: Math.max(0, total - used) };
}

/** כותרת המסך: מקבלת פוקוס במעבר מסך, כדי שקורא המסך יודיע איפה אנחנו. */
export function PageTitle(props: { children: string; sub?: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.title = `${props.children} | הסל האישי`;
    ref.current?.focus({ preventScroll: false });
  }, [props.children]);
  return (
    <div className="p-stack" style={{ gap: "0.35em" }}>
      <h1 ref={ref} tabIndex={-1} style={{ outline: "none" }}>
        {props.children}
      </h1>
      {props.sub ? <p className="p-muted">{props.sub}</p> : null}
    </div>
  );
}

/** הדרך החוצה מהדיגיטל: בכל מסך. */
export function HelpButton() {
  const { t } = useT();
  return (
    <Link to="/citizen/help" className="p-btn p-btn--help p-btn--block">
      <Phone aria-hidden="true" size={22} />
      {t.talkToCompanion}
    </Link>
  );
}

export function reasonKey(s: RealService): string {
  return s.coreCategoryId && ["belonging", "health_function", "resilience", "digital", "prevention_products"].includes(s.coreCategoryId) ? s.coreCategoryId : "other";
}
