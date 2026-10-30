import { createContext, useContext, useMemo } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ClipboardList, Inbox, ListChecks, Users } from "lucide-react";
import { DemoBar, OfflineBanner, useOnline } from "../components/Frame";
import { buildCaseload, type CaseloadPerson } from "../caseload";
import { appSettings } from "../settings";
import { usePilot } from "../store";
import { useAutoSync } from "../sync";

const CaseloadContext = createContext<CaseloadPerson[]>([]);
/** לעטיפת מסכי 0.5 (פגישה משותפת, מעקב חודשי) בתוך לוח המלווה הקיים. */
export const CaseloadProvider = CaseloadContext.Provider;
export const useCaseload = () => useContext(CaseloadContext);
export const usePersonName = () => {
  const people = useCaseload();
  return (id: string) => people.find((p) => p.id === id)?.name ?? id;
};

export default function CompanionShell() {
  const { derived } = usePilot();
  const online = useOnline();
  const { pending } = useAutoSync(online);
  const people = useMemo(() => buildCaseload(), []);
  const openRequests = derived.requests.filter((r) => r.status === "open").length;
  const tabs = [
    { to: "/companion", end: true, label: "היום", Icon: ListChecks },
    { to: "/companion/requests", end: false, label: openRequests ? `בקשות (${openRequests})` : "בקשות", Icon: Inbox },
    { to: "/companion/caseload", end: false, label: "כל התיק", Icon: Users },
    { to: "/companion/log", end: false, label: "יומן", Icon: ClipboardList },
  ];

  return (
    <CaseloadContext.Provider value={people}>
      <div className="pilot pilot--companion" dir="rtl" lang="he">
        <a
          className="p-skip"
          href="#main"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("main")?.focus();
          }}
        >
          לדלג לתוכן
        </a>
        <DemoBar />
        <header className="p-topbar">
          <NavLink to="/companion" className="p-topbar__title">
            מלווה: {appSettings.companion.name}
          </NavLink>
          <span className={`p-badge ${pending ? "p-badge--wait" : "p-badge--ok"}`} role="status">
            {pending === 1 ? "שינוי אחד ממתין לסנכרון" : pending ? `${pending} שינויים ממתינים לסנכרון` : "הכל מסונכרן"}
          </span>
        </header>
        {!online ? <OfflineBanner text="אין חיבור. אפשר להמשיך לעבוד: הכל נשמר בטלפון ויסונכרן כשהחיבור יחזור." /> : null}
        <main id="main" tabIndex={-1} className="p-main">
          <Outlet />
        </main>
        <nav className="p-bottomnav" aria-label="ניווט המלווה">
          <ul>
            {tabs.map(({ to, end, label, Icon }) => (
              <li key={to}>
                <NavLink to={to} end={end}>
                  <Icon aria-hidden="true" size={22} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </CaseloadContext.Provider>
  );
}
