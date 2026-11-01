/**
 * הפגישה המשותפת והמעקב החודשי של 0.5, בתוך לוח המלווה הקיים.
 * המסכים עצמם (שאלון, המלצות, "עבד / חלקית / להחליף") נשארים כפי שנבנו:
 * בגופן גדול, כי המלווה מציגה אותם לאזרח על המסך. העיצוב תחום ב-.pilot.
 */
import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { buildCaseload } from "@/pilot/caseload";
import { CaseloadProvider } from "@/pilot/companion/CompanionShell";
import CompanionSession from "@/pilot/companion/Session";
import CompanionReview from "@/pilot/companion/Review";
import "@/pilot/pilot.css";

export default function CoordinatorPilotScreen({ screen }: { screen: "session" | "review" }) {
  const { id = "" } = useParams();
  const people = useMemo(() => buildCaseload(), []);
  return (
    <div className="space-y-4">
      <Link to={`/coordinator/patients/${id}`} className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-primary">
        <ArrowRight className="w-4 h-4" aria-hidden="true" /> חזרה לתיק
      </Link>
      <CaseloadProvider value={people}>
        <div className="pilot pilot--companion rounded-xl overflow-hidden" dir="rtl" lang="he" style={{ minHeight: "auto" }}>
          <div className="p-main">{screen === "session" ? <CompanionSession /> : <CompanionReview />}</div>
        </div>
      </CaseloadProvider>
    </div>
  );
}

/** הקישורים שבתוך מסכי 0.5 מובילים ל-/companion/...: מפנים לתיק בלוח המלווה. */
export function CompanionRedirect({ to }: { to: "" | "/session" | "/review" }) {
  const { id = "" } = useParams();
  return <Navigate to={`/coordinator/patients/${id}${to}`} replace />;
}
