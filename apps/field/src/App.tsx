import { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { AccessibilityStatement, AppShell, ToastProvider } from "@sal-ishi/ui";
import { BookOpen, Building2, ClipboardCheck, Grid3x3, Home, LineChart, Users } from "lucide-react";
import { useField } from "./store";
import HomeScreen from "./screens/HomeScreen";
import InspirationScreen from "./screens/InspirationScreen";
import SuppliersScreen from "./screens/SuppliersScreen";
import CatalogScreen from "./screens/CatalogScreen";
import CoverageScreen from "./screens/CoverageScreen";
import ActivityScreen from "./screens/ActivityScreen";
import SubmitScreen from "./screens/SubmitScreen";

const NAV = [
  { to: "/", label: "הרשות שלי", icon: <Home size={18} /> },
  { to: "/inspiration", label: "השראה", icon: <BookOpen size={18} /> },
  { to: "/suppliers", label: "אטלס ספקים", icon: <Building2 size={18} /> },
  { to: "/catalog", label: "הקטלוג שלי", icon: <Users size={18} /> },
  { to: "/coverage", label: "מבחן כיסוי", icon: <Grid3x3 size={18} /> },
  { to: "/activity", label: "מה הולך", icon: <LineChart size={18} /> },
  { to: "/submit", label: "אישור ושליחה", icon: <ClipboardCheck size={18} /> },
];

export default function App() {
  const hydrated = useField((s) => s.hydrated);
  const hydrate = useField((s) => s.hydrate);
  const authority = useField((s) => s.data.authority);
  const isDemo = useField((s) => s.isDemo);
  const seedVersion = useField((s) => s.seed.meta.version);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <HashRouter>
      <ToastProvider>
        <AppShell
          appName="אטלס וקטלוג סל אישי - שטח"
          nav={NAV}
          banner={isDemo ? <div className="demo-banner" role="note">מוצגים נתוני הדגמה סינתטיים. אין כאן נתונים אמיתיים.</div> : null}
          headerMeta={
            <>
              <span>{authority || "רשות לא הוגדרה"}</span>
              <span aria-hidden="true">|</span>
              <span>גרסת בסיס {seedVersion}</span>
            </>
          }
          footerNote="הנתונים נשמרים רק בדפדפן הזה. מעבר נתונים למטה נעשה רק בחבילת פיילוט."
        >
          {!hydrated ? (
            <p role="status" aria-live="polite">טוען נתונים...</p>
          ) : (
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/inspiration" element={<InspirationScreen />} />
              <Route path="/suppliers" element={<SuppliersScreen />} />
              <Route path="/catalog" element={<CatalogScreen />} />
              <Route path="/coverage" element={<CoverageScreen />} />
              <Route path="/activity" element={<ActivityScreen />} />
              <Route path="/submit" element={<SubmitScreen />} />
              <Route
                path="/accessibility"
                element={<AccessibilityStatement contact="לפניות בנושא נגישות: רכז הנגישות במוסד לביטוח לאומי." updated="נובמבר 2026" />}
              />
              <Route path="*" element={<HomeScreen />} />
            </Routes>
          )}
        </AppShell>
      </ToastProvider>
    </HashRouter>
  );
}
