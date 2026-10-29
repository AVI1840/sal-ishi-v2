import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, HeartHandshake, Info, RotateCcw, UserRound, WifiOff } from "lucide-react";
import { Alert, DemoBar, useTitle } from "./components/Frame";
import { DemoControls } from "./components/DemoControls";
import { appSettings, isDemo } from "./settings";
import { resetDemo } from "./reset";
import { prepareOffline } from "./offline";

/** כתובת המטה: אותו אתר בבנייה, שרת הפיתוח של המטה בהרצה מקומית. */
export const HQ_URL = import.meta.env.DEV ? "http://localhost:5175/" : "./hq/";
export const FIELD_URL = import.meta.env.DEV ? "http://localhost:5174/" : "./field/";

export default function Personas() {
  useTitle("בחירת דמות");
  const [msg, setMsg] = useState<string | null>(null);
  const demo = isDemo();

  return (
    <div className="pilot" dir="rtl" lang="he">
      <DemoBar />
      <header className="p-topbar">
        <span className="p-topbar__title">הסל האישי להזדקנות מיטבית</span>
        <span className="p-small">גרסה {appSettings.version}</span>
      </header>
      <main id="main" className="p-main" style={{ maxWidth: "60em" }}>
        <div className="p-stack" style={{ gap: "0.35em" }}>
          <h1>{demo ? "הדגמה: שלוש דמויות" : "כניסה לפיילוט"}</h1>
          <p className="p-muted">
            {demo
              ? "כל האנשים והנתונים בהדגמה בדויים. אפשר לפתוח את האזרחית והמלווה בשתי לשוניות: מה שקורה אצל אחת מופיע אצל השנייה."
              : "הכלי מגדיר את השירותים, הכללים והמדדים. הנקודות, התשלומים והרישום בפלטפורמת הספק."}
          </p>
        </div>

        <div className="p-persona-grid">
          <Link to="/citizen" className="p-persona">
            <div className="p-card">
              <span className="p-icon-circle" aria-hidden="true">
                <UserRound size={26} />
              </span>
              <h2>שרה, 78, אזרחית ותיקה</h2>
              <p>פסגת זאב. רואה את הסל, מזמינה חוג, מבטלת, ומבקשת עזרה.</p>
              <span className="p-btn p-btn--primary">להיכנס כאזרחית</span>
            </div>
          </Link>
          <Link to="/companion" className="p-persona">
            <div className="p-card">
              <span className="p-icon-circle" aria-hidden="true">
                <HeartHandshake size={26} />
              </span>
              <h2>{appSettings.companion.name}, מלווה</h2>
              <p>{appSettings.companion.caseload_size} אנשים בתיק. מי דורש פנייה היום, אישורים, ביקורים ואשפוז.</p>
              <span className="p-btn p-btn--primary">להיכנס כמלווה</span>
            </div>
          </Link>
          <a href={HQ_URL} className="p-persona">
            <div className="p-card">
              <span className="p-icon-circle" aria-hidden="true">
                <Building2 size={26} />
              </span>
              <h2>גורם מטה</h2>
              <p>הקטלוג, הכללים, המדדים והייצוא לספק, מאותו מקור. כל כלל פתוח מסומן "הצעה, ממתין להכרעה".</p>
              <span className="p-btn p-btn--primary">להיכנס למטה</span>
            </div>
          </a>
        </div>

        <div className="p-row">
          <Link to="/scope" className="p-btn p-btn--secondary">
            <Info aria-hidden="true" size={18} />
            מה הכלי כן ולא עושה
          </Link>
          <a href={FIELD_URL} className="p-btn p-btn--ghost">
            משטח השטח (רכזת פיילוט)
          </a>
        </div>

        {demo ? (
          <section className="p-card" aria-labelledby="demo-h">
            <h2 id="demo-h">לפני ההדגמה</h2>
            <div className="p-row">
              <button
                type="button"
                className="p-btn p-btn--secondary"
                onClick={async () => {
                  await resetDemo();
                  setMsg("ההדגמה אופסה. כל הנתונים של גרסה זו במכשיר נמחקו, ונתוני ההדגמה ייטענו מחדש.");
                }}
              >
                <RotateCcw aria-hidden="true" size={18} />
                איפוס ההדגמה
              </button>
              <button
                type="button"
                className="p-btn p-btn--ghost"
                onClick={async () => setMsg(await prepareOffline())}
              >
                <WifiOff aria-hidden="true" size={18} />
                הכנה לעבודה בלי אינטרנט
              </button>
            </div>
            {msg ? (
              <Alert tone="success" live>
                <p>{msg}</p>
              </Alert>
            ) : null}
            <DemoControls />
          </section>
        ) : null}
      </main>
    </div>
  );
}
