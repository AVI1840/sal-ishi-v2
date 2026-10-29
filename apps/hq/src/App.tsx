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
  LearningNotebook,
  PartnerGuide,
  ToastProvider,
} from "@sal-ishi/ui";
import { BookOpenCheck, Building2, Compass, FileOutput, Globe2, History, Inbox, LayoutDashboard, Map as MapIcon, MessageSquare, Scale, SlidersHorizontal } from "lucide-react";
import { useHq } from "./store";
import IntakeScreen from "./screens/IntakeScreen";
import NationalScreen from "./screens/NationalScreen";
import SuppliersScreen from "./screens/SuppliersScreen";
import PricesScreen from "./screens/PricesScreen";
import RulesScreen from "./screens/RulesScreen";
import ExportScreen from "./screens/ExportScreen";
import OverviewScreen from "./screens/OverviewScreen";
import HistoryScreen from "./screens/HistoryScreen";
import NationalChannelScreen from "./screens/NationalChannelScreen";

const preview = EDITION === "preview";

const NAV = [
  ...(preview ? [{ to: "/guide", label: "מדריך לשותפים", icon: <Compass size={18} /> }] : []),
  { to: "/", label: "סקירה", icon: <LayoutDashboard size={18} /> },
  { to: "/intake", label: "קליטת חבילות", icon: <Inbox size={18} /> },
  { to: "/national", label: "תמונה ארצית", icon: <MapIcon size={18} /> },
  { to: "/suppliers", label: "ספקים", icon: <Building2 size={18} /> },
  { to: "/national-channel", label: "ערוץ ארצי", icon: <Globe2 size={18} /> },
  { to: "/prices", label: "מחירי ייחוס", icon: <Scale size={18} /> },
  { to: "/rules", label: "ספרייה וכללים", icon: <SlidersHorizontal size={18} /> },
  { to: "/export", label: "ייצוא", icon: <FileOutput size={18} /> },
  { to: "/learning", label: "פנקס למידה", icon: <BookOpenCheck size={18} /> },
  { to: "/history", label: "גרסאות ויומן", icon: <History size={18} /> },
  ...(preview ? [{ to: "/feedback", label: "המשוב שלי", icon: <MessageSquare size={18} /> }] : []),
];

const GUIDE_STEPS = [
  { to: "/", title: "סקירה", text: "הקטלוג, הכללים, המדדים והייצוא במבט אחד, מאותו מקור. כל כלל פתוח מסומן הצעה." },
  { to: "/intake", title: "קליטת חבילות", text: "שתי חבילות פיילוט סינתטיות כבר נקלטו. נסו לקלוט חבילה שייצאתם ממשטח השטח, ולראות את ההבדלים לפני המיזוג." },
  { to: "/national", title: "תמונה ארצית", text: "השוואה בין פיילוטים לפי אותם כללים: כיסוי, מיצוי ודגלים אדומים, ומגוון ספקים לכל קטגוריה." },
  { to: "/prices", title: "מחירי ייחוס", text: "חציון לכל סוג שירות ויחידה על פני הפיילוטים, וחריגות מעל הסף. בלי מחיר גג." },
  { to: "/rules", title: "ספרייה וכללים", text: "שכבות ההתאמה לאזרח ומשקלותיהן, דירוג ספקים וכללי בחירה. שנו רצפה או סף ובדקו שהתמונה הארצית מתעדכנת מיד." },
  { to: "/national-channel", title: "ערוץ ארצי", text: "מוצרי מניעה ובטיחות מספקים ארציים, שמופיעים בקטלוג של כל שכונה." },
  { to: "/export", title: "ייצוא", text: "תקן קליטת מפעילים לספק העל עם בדיקת סכמה ו-JSON Schema, וקטלוג מאושר לכל שכונה עבור הכלי לאזרח." },
  { to: "/suppliers", title: "ספקים", text: "כל הספקים בפיילוטים. פרטי ספק יחיד נשמרים במטה ולא יוצאים ממנו." },
];

export default function App() {
  const hydrated = useHq((s) => s.hydrated);
  const hydrate = useHq((s) => s.hydrate);
  const seed = useHq((s) => s.seed);
  const pilots = useHq((s) => new Set(s.state.neighborhoods.map((n) => n.authority)).size);
  const isDemo = useHq((s) => s.isDemo);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <HashRouter>
      <ToastProvider>
        <FeedbackProvider surface="מטה">
          <AppShell
            appName="אטלס וקטלוג סל אישי - מטה"
            nav={NAV}
            banner={
              preview ? (
                <div className="demo-banner" role="note">
                  גרסת תצוגה לשותפים, לפני שימוש בפיילוטים. כל הנתונים סינתטיים.{" "}
                  <a href={import.meta.env.DEV ? "http://localhost:5173/" : "../"}>להחלפת דמות</a>
                </div>
              ) : isDemo ? (
                <div className="demo-banner" role="note">מוצגים נתוני הדגמה סינתטיים.</div>
              ) : null
            }
            headerMeta={
              <>
                {preview ? <FeedbackButton /> : null}
                <span>{pilots} פיילוטים</span>
                <span aria-hidden="true">|</span>
                <span>גרסת בסיס {seed.meta.version}</span>
              </>
            }
            footerNote="משטח המטה של ביטוח לאומי. הנתונים נשמרים רק בדפדפן הזה."
          >
            {!hydrated ? (
              <p role="status" aria-live="polite">טוען נתונים...</p>
            ) : (
              <Routes>
                <Route path="/" element={<OverviewScreen />} />
                <Route path="/intake" element={<IntakeScreen />} />
                <Route path="/learning" element={<LearningNotebook surface="מטה" />} />
                <Route path="/history" element={<HistoryScreen />} />
                <Route path="/national" element={<NationalScreen />} />
                <Route path="/suppliers" element={<SuppliersScreen />} />
                <Route path="/prices" element={<PricesScreen />} />
                <Route path="/rules" element={<RulesScreen />} />
                <Route path="/export" element={<ExportScreen />} />
                <Route path="/national-channel" element={<NationalChannelScreen />} />
                <Route
                  path="/guide"
                  element={<PartnerGuide surface="hq" seed={seed} steps={GUIDE_STEPS} otherSurface={{ href: "../field/", label: "למשטח השטח" }} />}
                />
                <Route path="/feedback" element={<FeedbackScreen sendTo={FEEDBACK_EMAIL} />} />
                <Route
                  path="/accessibility"
                  element={<AccessibilityStatement contact="לפניות בנושא נגישות: רכז הנגישות במוסד לביטוח לאומי." updated="נובמבר 2026" />}
                />
                <Route path="*" element={<OverviewScreen />} />
              </Routes>
            )}
          </AppShell>
        </FeedbackProvider>
      </ToastProvider>
    </HashRouter>
  );
}
