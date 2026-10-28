// מדריך לשותפים: מה הכלי, על אילו הכרעות הוא מבוסס, מה עוד פתוח, מה לנסות
// ועל מה אנחנו מבקשים משוב. הסעיפים הפתוחים נקראים מה-seed ולא נכתבים כאן.

import { Link } from "react-router-dom";
import { proposalKeys, type Seed } from "@sal-ishi/core";
import { Alert, ProposalBadge } from "./controls";
import { PageHeader } from "./shell";

export const EDITION: "preview" | "pilot" = import.meta.env.VITE_EDITION === "pilot" ? "pilot" : "preview";
export const FEEDBACK_EMAIL: string | undefined = import.meta.env.VITE_FEEDBACK_EMAIL || undefined;

const PROPOSAL_LABELS: Record<string, string> = {
  points_rollover_months: "צבירת נקודות עד שלושה חודשים",
  cancellation_notice_hours: "מדיניות ביטול",
  no_show_free_per_quarter: "היעדרויות בלי חיוב ברבעון",
  hot_meal_entry_criteria: "קריטריון כניסה לארוחה חמה",
  matching_weights: "משקלות שכבות ההתאמה לאזרח",
  supplier_rating_weights: "משקלות דירוג הספקים",
  selection_min_per_domain: "בחירת האזרח: שירות מכל תחום",
  selection_max_active: "בחירת האזרח: עד 8 שירותים פעילים",
  selection_change_months: "בחירת האזרח: החלפה חודשית",
  suggestions_per_domain: "מספר ההצעות בכל תחום",
  competition_max_suppliers_local: "תחרות: עד 3 ספקים לסוג שירות בשכונה",
  competition_max_suppliers_national: "תחרות: עד 5 ספקים לסוג מוצר ארצי",
  subcategory_breadth_min: "רוחב: לפחות 2 תתי-קטגוריות בכל קטגוריית ליבה",
  subarea_alert_min: "התראה קוגניטיבית כשאין שירות בתת-התחום",
};

const FLOW = [
  { who: "מלווה ואזרח", title: "כלי מרכזי: שיחה ובחירה", text: "חיפוש חכם והצעות לפי תחום מתוך הקטלוג המאושר. בקשה בלי מענה נרשמת כ\"ביקשו ואין\".", out: "ביקשו ואין, מצטבר" },
  { who: "רכזת ומנהלת שכונה", title: "שטח: אטלס וקטלוג", text: "ספקים ודירוגם, שירותים, מבחן כניסה, מבחן כיסוי עם פערי הביקוש, ואישור בוועדה.", out: "חבילת פיילוט" },
  { who: "צוות ביטוח לאומי", title: "מטה: תקן ארצי", text: "איחוד פיילוטים, מחירי ייחוס, כללים ומשקלות, וערוץ מוצרים ארצי.", out: "קטלוג מאושר וגרסת בסיס" },
  { who: "אזרח ומלווה", title: "כלי מרכזי: התאמה", text: "חמש שכבות התאמה עם משקלות מהמטה, ביקוש בפועל ודירוג ספק.", out: "בחירה של 6 עד 8 שירותים" },
  { who: "אינטגרטור", title: "מימוש", text: "catalog_export: חוזה שביטוח לאומי מחזיק. נקודות, תשלומים ונוכחות אצל האינטגרטור.", out: "שירות בפועל" },
];

const LAYERS = [
  { key: "prevention", label: "מניעת הידרדרות", source: "קטגוריה וסוג השירות בספרייה" },
  { key: "motivation", label: "רצון ומוטיבציה", source: "תחום הליבה מול מה שהאדם רוצה" },
  { key: "profileFit", label: "התאמה לפרופיל", source: "שפות, התאמה קהילתית, אופן מסירה" },
  { key: "socialProof", label: "המלצות וניסיון", source: "ביקוש בפועל בשכונה ודירוג הספק" },
  { key: "proximity", label: "זמינות מעשית", source: "שכונה, היקף (רשותי, אזורי, ארצי), השתתפות עצמית" },
];

function TableLayers({ seed }: { seed: Seed }) {
  const w = (seed.settings.matching_weights ?? {}) as Record<string, number>;
  return (
    <div className="table-wrap" role="region" aria-label="שכבות ההתאמה" tabIndex={0}>
      <table className="table">
        <thead>
          <tr>
            <th scope="col">שכבה</th>
            <th scope="col">משקל</th>
            <th scope="col">מה מזין אותה מהאטלס</th>
          </tr>
        </thead>
        <tbody>
          {LAYERS.map((l) => (
            <tr key={l.key}>
              <th scope="row">{l.label}</th>
              <td className="num">{w[l.key] !== undefined ? `${Math.round(w[l.key]! * 100)}%` : "-"}</td>
              <td>{l.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface GuideStep {
  to: string;
  title: string;
  text: string;
}

export function PartnerGuide(props: {
  surface: "field" | "hq";
  seed: Seed;
  steps: GuideStep[];
  otherSurface?: { href: string; label: string };
}) {
  const openItems = (props.seed.meta.open_items as string[] | undefined) ?? [];
  const proposals = proposalKeys(props.seed.settings);

  return (
    <>
      <PageHeader
        title="מדריך לשותפים"
        description="גרסת תצוגה של אטלס וקטלוג הסל האישי להזדקנות מיטבית, לפני שימוש בפיילוטים. נשמח להתרשמות ולמשוב שלכם."
      />

      <Alert tone="warning" title="גרסת תצוגה עם נתונים סינתטיים">
        כל השמות, השכונות, הספקים והמספרים מומצאים. אין בכלי ואין לכתוב בו שום פרט מזהה של תושב. כל מה שתזינו נשמר רק בדפדפן שלכם.
      </Alert>

      <section className="card" aria-labelledby="g-what">
        <h2 id="g-what">מה זה</h2>
        <p>
          כלי אחד עם ליבה משותפת ושלושה משטחים. <strong>שטח</strong>: רכזת הפיילוט ומנהלת השכונה ממפות ספקים ושירותים, בונות קטלוג לכל שכונה,
          מעלות פעילות חודשית מצטברת ושולחות חבילת פיילוט. <strong>מטה</strong>: ביטוח לאומי מאחד את החבילות, רואה תמונה ארצית ומחירי ייחוס,
          מנהל את הכללים ומייצא את הקטלוג המאושר לאינטגרטור. <strong>אזרח</strong>: הכלי הקיים "סל אישי" יקרא את הקטלוג המאושר לשכונה (בגרסה הבאה).
        </p>
        <p>הכלי מגדיר את הקטלוג בלבד. אין בו נקודות, תשלומים או הזדהות של אזרחים: את אלה מפעיל האינטגרטור.</p>
        {props.otherSurface ? (
          <p>
            אתם במשטח ה{props.surface === "field" ? "שטח" : "מטה"}. <a href={props.otherSurface.href}>{props.otherSurface.label}</a>
          </p>
        ) : null}
      </section>

      <section className="card" aria-labelledby="g-flow">
        <h2 id="g-flow">איך הכל מתחבר</h2>
        <p>מעגל אחד, מהבקשה של האזרח ועד שירות זמין בשכונה. כל חץ הוא קובץ (בשלב א') או API (בשלב ב').</p>
        <ol className="flow">
          {FLOW.map((step, i) => (
            <li key={step.title} className="flow__step">
              <span className="flow__num" aria-hidden="true">{i + 1}</span>
              <span className="flow__who">{step.who}</span>
              <strong className="flow__title">{step.title}</strong>
              <span className="flow__text">{step.text}</span>
              <span className="flow__out">{step.out}</span>
            </li>
          ))}
        </ol>
        <p className="muted">ובחזרה לצעד 1: מה שאזרחים ביקשו ואין, ודירוג הספקים, משפיעים על מה שהרשות משלימה ועל מה שמוצע לאזרח הבא.</p>
      </section>

      <section className="card" aria-labelledby="g-layers">
        <h2 id="g-layers">מה מזין כל שכבה בהתאמה לאזרח</h2>
        <p>מנוע ההתאמה בכלי המרכזי לא השתנה. מה שהשתנה הוא שכל שכבה מקבלת עכשיו נתון אמיתי מהאטלס, והמשקלות מנוהלים במטה.</p>
        <TableLayers seed={props.seed} />
      </section>

      <section className="card" aria-labelledby="g-basis">
        <h2 id="g-basis">על מה זה מבוסס</h2>
        <ul>
          <li>סיכום מפגש 2 של צוות היישום (26.10.2026): שישה שדות חובה, השתתפות עצמית (0% ליבה ומניעה, 20% חוגים, עד 50% איכות חיים), פרופיל קהילתי לכל שכונה ובדיקת כיסוי לפי התאמה.</li>
          <li>פגישת החשכ"ל (28.10.2026): בלי מחיר גג, מחיר ליחידה ומחיר שוק לייחוס, ספק כישות עם סוג עוסק, אופן מסירה (בבית ומרחוק), שיטת אימות נוכחות ומדיניות ביטול, ומיצוי בחלון מתגלגל.</li>
          <li>אטלס השירותים של פיילוט ירושלים (ינואר 2025 עד אוגוסט 2026), נתונים מצטברים בלבד: {props.seed.service_types.length} סוגי שירות ב-{props.seed.categories.length} קטגוריות.</li>
          <li>כל סף וכלל נקרא מקובץ הבסיס (גרסה {props.seed.meta.version}) ולא מקודד, כך ששינוי הכרעה משנה הגדרה ולא קוד.</li>
        </ul>
      </section>

      <section className="card" aria-labelledby="g-open">
        <h2 id="g-open">מה עוד פתוח</h2>
        <p>ערכים שמסומנים <ProposalBadge /> בכלי ממתינים להכרעה במפגש 3 (26.11.2026):</p>
        <ul>
          {proposals.map((k) => <li key={k}>{PROPOSAL_LABELS[k] ?? k}</li>)}
        </ul>
        {openItems.length ? (
          <>
            <h3>סעיפים פתוחים בקובץ הבסיס</h3>
            <ul>{openItems.map((item) => <li key={item}>{item}</li>)}</ul>
          </>
        ) : null}
      </section>

      <section className="card" aria-labelledby="g-try">
        <h2 id="g-try">מה כדאי לנסות</h2>
        <ol className="stack">
          {props.steps.map((s) => (
            <li key={s.to + s.title}>
              <Link to={s.to}><strong>{s.title}</strong></Link>: {s.text}
            </li>
          ))}
        </ol>
      </section>

      <section className="card" aria-labelledby="g-ask">
        <h2 id="g-ask">על מה נשמח למשוב</h2>
        <ul>
          <li>האם הכללים והמספרים תואמים את ההכרעות כפי שאתם מבינים אותן?</li>
          <li>האם המונחים ברורים לרכזת ולמנהלת שכונה, בלי הדרכה?</li>
          <li>חסר שדה, סטטוס או דוח שאתם צריכים? יש משהו מיותר?</li>
          <li>האם תהליך האישור והשליחה מתאים לאופן שבו הוועדה ברשות עובדת?</li>
          <li>מה ייקח לרכזת חדשה לבנות קטלוג של 20 שירותים לשכונה? (היעד: פחות משעתיים)</li>
        </ul>
        <p>
          בכל מסך יש כפתור <strong>"הוספת משוב"</strong>. ההערות נאספות במסך <Link to="/feedback">המשוב שלי</Link>, ומשם מורידים קובץ Excel
          {FEEDBACK_EMAIL ? <> ושולחים אל <a href={`mailto:${FEEDBACK_EMAIL}`}>{FEEDBACK_EMAIL}</a></> : " ושולחים לצוות היישום"}.
        </p>
      </section>
    </>
  );
}
