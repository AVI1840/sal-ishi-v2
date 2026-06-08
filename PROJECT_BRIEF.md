# סל אישי — להזדקנות מיטבית | תיאור מלא לפיתוח

## מטרה עליונה

מערכת AI שמתאימה שירותי מניעה לאזרחים ותיקים (65+) לפי פרופיל אישי.
רפורמת סיעוד ממשלתית — החלטות ממשלה 127 ו-150.
**יעד:** דחיית הידרדרות ב-20% = חיסכון ₪2 מיליארד שנתי.

## הפיילוט

- **מיקום:** ירושלים — 5 שכונות (פסגת זאב, תלפיות מזרח, בית חנינא, נווה יעקב, עין כרם)
- **משתתפים:** 286 אזרחים ותיקים
- **מלוות:** 3 מלוות חברתיות
- **שירותים:** 102 שירותים ממופים בקטלוג
- **מגזרים:** חילוני, ערבי, חרדי, מעורב

## מבנה המערכת — 3 כלים

### 1. sal-ishi-v2 (הכלי המרכזי)
**URL:** https://avi1840.github.io/sal-ishi-v2/
**Tech:** React + TypeScript + Vite + Tailwind + shadcn/ui
**Repo:** https://github.com/AVI1840/sal-ishi-v2
**Branch:** main

**דפים:**
| Route | תפקיד |
|-------|--------|
| `/` | דף בית — כניסה ל-5 ממשקים |
| `/citizen` | ממשק אזרח — שירותים, שיחה, פרופיל |
| `/citizen/services` | רשימת 102 שירותים עם סינון |
| `/citizen/services/:id` | פרטי שירות + דירוג |
| `/citizen/chat` | צ'אט AI (לימור) |
| `/citizen/profile` | פרופיל אישי |
| `/coordinator` | דשבורד מלווה — KPIs, Agentic Flow, AI |
| `/coordinator/patients` | רשימת 286 אזרחים |
| `/coordinator/patients/:id` | פרופיל אזרח מפורט |
| `/coordinator/services-map` | 102 שירותים + dimensions + סינון |
| `/coordinator/catalog` | קטלוג סל — 5 תחומי ליבה (מסמך ממשלה) |
| `/coordinator/agents` | 5 אייג'נטים AI + הפעלה ידנית |
| `/coordinator/ai` | עוזר AI — צ'אט + תובנות |
| `/coordinator/intake` | קליטה חדשה — 5 שלבים + תמלול |
| `/coordinator/algorithm` | אלגוריתם 5 שכבות — sliders |
| `/coordinator/deterioration` | ניטור הידרדרות + SDI/RDI |
| `/coordinator/actions` | משימות CRM |
| `/coordinator/bookings` | הזמנות |
| `/executive` | דשבורד ניהולי — KPIs, timeline, מפה |
| `/executive/catalog` | קטלוג סל (ניהולי) |
| `/providers` | פורטל ספקים — tabs |
| `/hackathon` | דף פיץ' להאקתון AWS |

**קבצי מפתח:**
- `src/data/serviceCatalog.ts` — 102 שירותים + 5 dimensions לכל שירות
- `src/data/realServices.ts` — utilities + filterServices
- `src/lib/matchingEngine.ts` — אלגוריתם 5 שכבות
- `src/data/services-research/services-catalog.json` — raw data
- `src/data/services-research/agent-weekly-prompt.md` — פרומפט אייג'נט
- `src/data/services-research/matching-algorithm.md` — תיעוד אלגוריתם
- `src/data/mockData.ts` — 75 אזרחים עם פרופילים מלאים

---

### 2. SAL-ISHI-SIUD (דשבורד מלווה מפורט)
**URL:** https://avi1840.github.io/SAL-ISHI-SIUD/
**Source:** `libi-ai-main/frontend/case-manager-dashboard/`
**Deploy:** gh-pages branch של github.com/AVI1840/SAL-ISHI-SIUD

**בעיה ידועה:** ה-deploy האחרון שבר את ה-routing (base path). צריך לתקן.

**דפים:**
| Route | תפקיד |
|-------|--------|
| `/` | דשבורד ראשי — KPIs, RDI/SDI, לוח יומי, פעולות |
| `/clients` | רשימת 75 אזרחים |
| `/clients/:id` | פרופיל מפורט |
| `/intake` | קליטה — 5 שלבים + הקלטה |
| `/actions` | פעולות מלווה |
| `/alerts` | התראות |
| `/bookings` | הזמנות |
| `/reports` | דוחות |
| `/strategic` | דשבורד ניהולי — SDI/RDI trends |
| `/algorithm` | אלגוריתם התאמה |
| `/deterioration` | ניטור הידרדרות (הדף הכי טוב בעיצוב) |
| `/settings` | הגדרות |

**מדדים:**
- **RDI** (Risk Deterioration Index) — ככל שגבוה יותר = סיכון גדול יותר. מעל 1.3 = דורש התערבות.
- **SDI** (Service Diversity Index) — כמה שירותי מניעה פעילים. 0 = לא משתמש. יעד: 17+.

---

### 3. libi-sal-ishi (ממשק אזרח מלא)
**URL:** https://libi-sal-ishi.vercel.app/
**Source:** `libi-ai-main/frontend/case-manager-dashboard/` (אותו source כמו SIUD)

**דגשים:**
- תמונות גדולות לשירותים
- כרטיסים עם ציון, ימים, מרחק
- ארנק 640 יחידות
- ניווט: בית, שירותים, פרופיל, שאלות

---

## אלגוריתם ההתאמה — 5 שכבות

| שכבה | משקל | מה בודקת |
|------|------|---------|
| מניעת הידרדרות | 40% | מה מוכח מחקרית שמעכב ירידה |
| רצון ומוטיבציות | 25% | מה האדם רוצה לעשות |
| התאמה לפרופיל | 20% | ניידות, שפה, מגזר, מגבלות |
| זמינות מעשית | 10% | שכונה, הסעות, שעות |
| המלצות וניסיון | 5% | דירוגי משתמשים |

## 5 אייג'נטים AI

| Agent | תפקיד | תדירות |
|-------|--------|--------|
| Service Discovery | סריקת שירותים חדשים ב-25 מקורות | שבועי |
| Matching Engine | חישוב ציוני התאמה 286×102 | שבועי + אחרי אינטייק |
| Deterioration Monitor | ניטור סימני הידרדרות | יומי |
| Nudge Engine | חיזוקים ותזכורות מותאמים | יומי + event |
| Super Agent | תיזמון וניהול כל האייג'נטים | 24/7 |

## קטלוג שירותים — 5 תחומי ליבה

1. **שייכות ומשמעות** — מועדונים, התנדבות, תרבות, חוגים
2. **תפקוד ובריאות** — כושר, קוגניציה, תזונה, מניעת נפילות
3. **חוסן אישי וכלכלי** — מיצוי זכויות, תמיכה נפשית, עזרה ביתית
4. **דיגיטציה תומכת** — סמארטפון, תמיכה טכנית, טלמדיסין
5. **מוצרים מסייעים** — שמיעה, נפילות, טכנולוגיה, ציוד

## מה צריך לשפר (בעיות ידועות)

1. **SAL-ISHI-SIUD** — ה-deploy שבור (base path `/SAL-ISHI-SIUD/` לא מתאים לקבצים שנבנו)
2. **דף הבית sal-ishi-v2** — לא מספיק מרשים, צריך עיצוב premium
3. **דף האקתון** — timer gimmick, צריך מצגת slide-style (אתגר→פתרון→ערך)
4. **ממשק אזרח sal-ishi-v2** — פחות טוב מ-libi-sal-ishi (אין תמונות, כרטיסים קטנים)
5. **ניהולי + ספקים** — בסדר אבל לא premium

## טכנולוגיה

- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- Charts: Recharts
- Routing: react-router-dom (HashRouter)
- State: React state + localStorage
- Deploy: GitHub Pages (sal-ishi-v2, SAL-ISHI-SIUD) + Vercel (libi-sal-ishi)
- AI (planned): Amazon Bedrock (Claude), Transcribe, Personalize, Lambda, S3, DynamoDB

## קהלי יעד

| קהל | מה מציגים | מתי |
|-----|----------|------|
| צוות האצה (מלוות) | sal-ishi-v2/coordinator + SAL-ISHI-SIUD | יום שני |
| האקתון AWS | sal-ishi-v2/hackathon + דמו חי | 23/06/26 |
| בכירים (יואב, אורי) | sal-ishi-v2/executive + demo flow | לפי צורך |

## סגנון עיצוב

- צבע ראשי: #1B3A5C (כחול כהה)
- כיוון: RTL
- פונט: Heebo / system
- ללא אימוגי בממשק (חוץ מצ'אט AI)
- עיצוב: מקצועי, ממשלתי, נקי
- Accessibility: כפתורים גדולים (min 48px), טקסט קריא, ניגודיות
