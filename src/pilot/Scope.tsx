import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import { DemoBar, useTitle } from "./components/Frame";

export const DOES = [
  "מגדיר את קטלוג השירותים המאושר לכל שכונה, עם מבחן כניסה ומבחן כיסוי.",
  "מגדיר את הכללים: מחיר, השתתפות עצמית, ביטול, אי-הגעה, אשפוז, תקרת מוצרים ושירותים שנפתחים באישור מלווה.",
  "מחשב מדדים: מיצוי, חדירה, פריסה, מחיר לשעה וזמן לשירות ראשון, בלי תאים קטנים.",
  "מייצא לספק תקן קליטת מפעילים פתוח (JSON Schema), שכל ספק יכול לקרוא.",
  "מציג לאזרח ולמלווה ארנק מדומה בנקודות ושוק שירותים שכונתי מהאטלס, עם ההמלצה, התנאים ומסלול ההזמנה, ושולח אירועים לספק.",
  "רושם תובנות מהשטח בפנקס למידה, ומייצא אותן כרישום דרישות למכרז.",
  "מציג דירוג ספק משוקלל: התאמה לקהל היעד, דירוג לקוחות ושביעות רצון, דירוג מלווה, עמידה ברמת השירות ותוצאות. ההרכב והמשקלות ייקבעו בהמשך.",
];

export const DOES_NOT = [
  "מציג ארנק מדומה. ספק העל מנהל את הנקודות החיות, היתרות וספר החשבונות.",
  "לא מבצע תשלומים ולא מחייב אף אחד.",
  "לא רושם אזרחים ולא מחזיק נתוני תושבים. בהדגמה כל האנשים בדויים.",
  "לא מאמת נוכחות.",
  "אין בו שרת ואין התחברות עם נתוני זהות. אלה בפלטפורמת הספק.",
  "לא מכריע בכללים: כל כלל פתוח מסומן \"הצעה, ממתין להכרעה\" עד שהפורום מחליט.",
];

export const WHO: [string, string][] = [
  ["שירותים, כללים, מדדים, תקן קליטה", "הכלי הזה (שטח ומטה)"],
  ["חוויית האזרח והמלווה, ארנק מדומה, הזמנה וביטול", "הכלי הזה, שולח אירועים לספק העל"],
  ["נקודות חיות, יתרות, ספר חשבונות, תשלומים, רישום, אימות נוכחות", "ספק העל"],
  ["הכרעה בכללים פתוחים", "פורום התכנית (מפגש 3, 26.11.2026)"],
];

export default function Scope() {
  useTitle("מה הכלי כן ולא עושה");
  return (
    <div className="pilot" dir="rtl" lang="he">
      <DemoBar />
      <header className="p-topbar">
        <Link to="/" className="p-topbar__title">
          הסל האישי להזדקנות מיטבית
        </Link>
      </header>
      <main id="main" className="p-main" style={{ maxWidth: "52em" }}>
        <h1>מה הכלי כן ולא עושה</h1>
        <section className="p-card" aria-labelledby="does-h">
          <h2 id="does-h">הכלי כן</h2>
          <ul className="p-stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {DOES.map((x) => (
              <li key={x} className="p-row" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
                <Check aria-hidden="true" size={20} color="#367c39" style={{ flex: "none", marginTop: 3 }} />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="p-card" aria-labelledby="not-h">
          <h2 id="not-h">הכלי לא</h2>
          <ul className="p-stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {DOES_NOT.map((x) => (
              <li key={x} className="p-row" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
                <X aria-hidden="true" size={20} color="#c93435" style={{ flex: "none", marginTop: 3 }} />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="p-card" aria-labelledby="who-h">
          <h2 id="who-h">מי עושה מה בפיילוט</h2>
          <table className="p-table">
            <thead>
              <tr>
                <th scope="col">מה</th>
                <th scope="col">איפה</th>
              </tr>
            </thead>
            <tbody>
              {WHO.map(([what, where]) => (
                <tr key={what}><td>{what}</td><td>{where}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
        <Link to="/" className="p-btn p-btn--secondary">לחזור לבחירת דמות</Link>
      </main>
    </div>
  );
}
