import { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import {
  AccessibilityStatement,
  AppShell,
  EDITION,
  FEEDBACK_EMAIL,
  FeedbackButton,
  FeedbackProvider,
  FeedbackScreen,
  PartnerGuide,
  ToastProvider,
} from "@sal-ishi/ui";
import { BookOpen, Building2, ClipboardCheck, Compass, Grid3x3, Home, LineChart, MessageSquare, Users } from "lucide-react";
import { useField } from "./store";
import HomeScreen from "./screens/HomeScreen";
import InspirationScreen from "./screens/InspirationScreen";
import SuppliersScreen from "./screens/SuppliersScreen";
import CatalogScreen from "./screens/CatalogScreen";
import CoverageScreen from "./screens/CoverageScreen";
import ActivityScreen from "./screens/ActivityScreen";
import SubmitScreen from "./screens/SubmitScreen";

const preview = EDITION === "preview";

const NAV = [
  ...(preview ? [{ to: "/guide", label: "מדריך לשותפים", icon: <Compass size={18} /> }] : []),
  { to: "/", label: "הרשות שלי", icon: <Home size={18} /> },
  { to: "/inspiration", label: "השראה", icon: <BookOpen size={18} /> },
  { to: "/suppliers", label: "אטלס ספקים", icon: <Building2 size={18} /> },
  { to: "/catalog", label: "הקטלוג שלי", icon: <Users size={18} /> },
  { to: "/coverage", label: "מבחן כיסוי", icon: <Grid3x3 size={18} /> },
  { to: "/activity", label: "מה הולך", icon: <LineChart size={18} /> },
  { to: "/submit", label: "אישור ושליחה", icon: <ClipboardCheck size={18} /> },
  ...(preview ? [{ to: "/feedback", label: "המשוב שלי", icon: <MessageSquare size={18} /> }] : []),
];

const GUIDE_STEPS = [
  { to: "/", title: "הרשות שלי", text: "שכונות עם פרופיל קהילתי, תמונת מצב קצרה וההגדרות הפעילות. ערכים שעוד בהכרעה מסומנים הצעה." },
  { to: "/inspiration", title: "השראה", text: "ספריית סוגי השירות עם מה שנוסה בירושלים. סננו לפי פרופיל חרדי או ערבי, והוסיפו סוג לקטלוג." },
  { to: "/suppliers", title: "אטלס ספקים", text: "ספק כישות: סוג עוסק, שכונות, שפות והתאמה. שימו לב איך מסומן ספק שהוא אדם פרטי." },
  { to: "/catalog", title: "הקטלוג שלי", text: "כל שירות עובר מבחן כניסה עם סיבה. נסו לפתוח שירות, למחוק מחיר שוק ולראות את התוצאה משתנה. נסו גם ייבוא מ-Excel." },
  { to: "/coverage", title: "מבחן כיסוי", text: "שכונה מול חמש קטגוריות הליבה. לחצו על תא אדום כדי לראות הצעות להשלמה מהספרייה." },
  { to: "/activity", title: "מה הולך", text: "פעילות חודשית מצטברת, מיצוי הארנק בחלון מתגלגל ושירותים מתחת לסף." },
  { to: "/submit", title: "אישור ושליחה", text: "הגשה, אישור ודחייה עם נימוק, ייצוא חבילת פיילוט למטה ו-Excel לוועדה." },
];

export default function App() {
  const hydrated = useField((s) => s.hydrated);
  const hydrate = useField((s) => s.hydrate);
  const authority = useField((s) => s.data.authority);
  const isDemo = useField((s) => s.isDemo);
  const seed = useField((s) => s.seed);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <HashRouter>
      <ToastProvider>
        <FeedbackProvider surface="שטח">
          <AppShell
            appName="אטלס וקטלוג סל אישי - שטח"
            nav={NAV}
            banner={
              preview ? (
                <div className="demo-banner" role="note">גרסת תצוגה לשותפים, לפני שימוש בפיילוטים. כל הנתונים סינתטיים.</div>
              ) : isDemo ? (
                <div className="demo-banner" role="note">מוצגים נתוני הדגמה סינתטיים. אין כאן נתונים אמיתיים.</div>
              ) : null
            }
            headerMeta={
              <>
                {preview ? <FeedbackButton /> : null}
                <span>{authority || "רשות לא הוגדרה"}</span>
                <span aria-hidden="true">|</span>
                <span>גרסת בסיס {seed.meta.version}</span>
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
                  path="/guide"
                  element={<PartnerGuide surface="field" seed={seed} steps={GUIDE_STEPS} otherSurface={{ href: "../hq/", label: "למשטח המטה" }} />}
                />
                <Route path="/feedback" element={<FeedbackScreen sendTo={FEEDBACK_EMAIL} />} />
                <Route
                  path="/accessibility"
                  element={<AccessibilityStatement contact="לפניות בנושא נגישות: רכז הנגישות במוסד לביטוח לאומי." updated="נובמבר 2026" />}
                />
                <Route path="*" element={<HomeScreen />} />
              </Routes>
            )}
          </AppShell>
        </FeedbackProvider>
      </ToastProvider>
    </HashRouter>
  );
}
