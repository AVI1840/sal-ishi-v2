# הוראות לפיתוח — Claude Code

## מי אני
אביעד — צד עסקי. בניתי את המערכות בשיטת AI-assisted development. צריך ממך לקודד, לשפר, ולשדרג.

## המטרה
**"סל אישי — להזדקנות מיטבית"** — מערכת AI שמתאימה שירותי מניעה לאזרחים ותיקים (65+) לפי פרופיל אישי.
- רפורמת סיעוד ממשלתית — החלטות ממשלה 127 ו-150
- פיילוט חי: 286 אזרחים, פסגת זאב ירושלים
- יעד: דחיית הידרדרות ב-20% = חיסכון ₪2B שנתי
- האקתון AWS GenAI: 23/06/2026

---

## 3 מערכות — מה כל אחת ומה צריך

### 1. sal-ishi-v2 (הכלי המרכזי)
**GitHub:** https://github.com/AVI1840/sal-ishi-v2
**Live:** https://avi1840.github.io/sal-ishi-v2/
**Tech:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui
**Deploy:** GitHub Pages (auto from main branch)

**מה יש:**
- דף בית — כניסה ל-5 ממשקים
- `/citizen` — ממשק אזרח (שירותים, צ'אט AI, פרופיל)
- `/coordinator` — דשבורד מלווה (KPIs, Agentic Flow, AI chat, ניטור, agents, קטלוג, אינטייק)
- `/executive` — דשבורד ניהולי (KPIs, timeline, מפה, בקרה)
- `/providers` — פורטל ספקים (tabs: dashboard, הזמנות, שירותים, תשלומים, דירוגים)
- `/hackathon` — דף פיץ' להאקתון AWS (נסתר — 3 clicks על לוגו)

**מה צריך לשפר:**
1. דף הבית — לא מספיק premium/מרשים. צריך לבדוק אפשרויות: כהה vs לבן, כרטיסים ממוספרים, מצגת ערך
2. ממשק אזרח — כרטיסים קטנים מדי, אין תמונות. לראות כ-reference את libi-sal-ishi.vercel.app (תמונות גדולות, ציונים, ימים, "חינם")
3. דף האקתון — ה-timer "4 דקות" נראה גימיק. צריך מצגת slide-style: אתגר → פתרון → ערך → דמו
4. ניהולי — בסדר אבל אפשר יותר premium
5. ספקים — generic, אפשר יותר מותאם

**קבצי מפתח:**
```
src/App.tsx — routing ראשי
src/pages/DemoHome.tsx — דף בית
src/pages/citizen/CitizenHome.tsx — ממשק אזרח
src/pages/citizen/CitizenServices.tsx — רשימת שירותים
src/pages/citizen/CitizenServiceDetail.tsx — דף שירות
src/pages/citizen/CitizenChat.tsx — צ'אט AI (לימור)
src/pages/citizen/ServicesCatalog.tsx — קטלוג 5 תחומים
src/pages/coordinator/CoordinatorDashboard.tsx — דשבורד מלווה
src/pages/coordinator/CoordinatorAgents.tsx — 5 agents
src/pages/coordinator/CoordinatorServices.tsx — שירותים ממופים
src/pages/coordinator/CoordinatorDeterioration.tsx — SDI/RDI + ניטור
src/pages/coordinator/CoordinatorIntake.tsx — אינטייק 5 שלבים + הקלטה
src/pages/coordinator/CoordinatorAI.tsx — צ'אט + תובנות
src/pages/coordinator/CoordinatorAlgorithm.tsx — sliders 5 שכבות
src/pages/executive/ExecutiveOverview.tsx — דשבורד ניהולי
src/pages/providers/ProviderDashboard.tsx — ספקים
src/pages/prototype/Hackathon.tsx — דף האקתון
src/data/serviceCatalog.ts — 102 שירותים + dimensions
src/data/realServices.ts — filter utilities
src/data/mockData.ts — 75 אזרחים + KPIs + alerts + nudges
src/data/services-research/services-catalog.json — 102 שירותים raw
src/lib/matchingEngine.ts — אלגוריתם 5 שכבות
src/components/layout/AppShell.tsx — sidebar + layout
src/components/layout/MobileShell.tsx — bottom nav אזרח
src/components/layout/DemoNav.tsx — ניווט עליון
```

---

### 2. SAL-ISHI-SIUD (דשבורד מלווה מפורט)
**GitHub:** https://github.com/AVI1840/SAL-ISHI-SIUD (branch: gh-pages)
**Live:** https://avi1840.github.io/SAL-ISHI-SIUD/
**Source:** `libi-ai-main/frontend/case-manager-dashboard/`

**מה יש (ובעיצוב הכי טוב):**
- דשבורד יומי — KPIs, RDI/SDI, לוח זמנים, פעולות CRM
- ניטור הידרדרות (deterioration) — גרפים, טבלאות, צבעים לפי חומרה
- רשימת אזרחים (75) עם פרופיל מפורט
- אינטייק — 5 שלבים + הקלטה
- דשבורד ניהולי (strategic) — SDI/RDI trends, timeline רפורמה
- אלגוריתם התאמה

**מה צריך לשפר:**
1. שירותים — עדכנתי לפסגת זאב (20 שירותים אמיתיים). לוודא שעובד
2. שם — החלפתי "מתאמת" ← "מלווה חברתית" ב-sidebar. לוודא בכל מקום
3. Router — החלפתי ל-HashRouter לתמיכה ב-GitHub Pages. לוודא routing עובד
4. כמות אזרחים — 75 (לא 286). זה נכון כי זו מערכת ממוקדת למלווה אחת

**Build & Deploy:**
```bash
cd libi-ai-main/frontend/case-manager-dashboard
npm run build
# copy dist/* to SAL-ISHI-SIUD repo (gh-pages branch)
# push gh-pages
```

---

### 3. libi-sal-ishi (ממשק אזרח מלא)
**Live:** https://libi-sal-ishi.vercel.app/
**Source:** אותו source כמו SAL-ISHI-SIUD (case-manager-dashboard)
**Deploy:** Vercel (auto)

**מה יש (ובעיצוב מצוין):**
- תמונות גדולות לכל שירות
- כרטיסים עם: ציון, ימים, מרחק, "חינם"
- ארנק 640 יחידות
- ברכה אישית "שלום, שרה"
- ניווט: בית, שירותים, פרופיל, שאלות

**הערה:** כל שינוי ב-case-manager-dashboard משפיע על שניהם (SAL-ISHI-SIUD + libi-sal-ishi). ה-base path ב-vite.config.ts קובע.

---

## אלגוריתם ההתאמה — 5 שכבות

```
final_score = (prevention × 0.40) + (motivation × 0.25) + (profile × 0.20) + (proximity × 0.10) + (social_proof × 0.05)
```

| שכבה | משקל | מה מודד |
|------|------|---------|
| Prevention | 40% | match_score מקטלוג × risk_level × functional_fit |
| Motivation | 25% | keywords מ-motivations vs subcategory+notes |
| Profile | 20% | mobility match + language + age |
| Proximity | 10% | neighborhood match + transport + home_visit |
| Social Proof | 5% | certainty + ratings (placeholder) |

**קובץ:** `src/lib/matchingEngine.ts`

---

## 5 אייג'נטים AI

| # | Agent | תפקיד | תדירות | קובץ |
|---|-------|--------|--------|------|
| 1 | Service Discovery | סריקת 25+ מקורות לשירותים חדשים | שבועי (ראשון 06:00) | agent-weekly-prompt.md |
| 2 | Matching Engine | חישוב 286×102 ציוני התאמה | שבועי + אחרי אינטייק | matchingEngine.ts |
| 3 | Deterioration Monitor | זיהוי ירידה בפעילות, בדידות, ביטולים | יומי (07:30) | CoordinatorDeterioration.tsx |
| 4 | Nudge Engine | חיזוקים, תזכורות, reactivation | יומי (08:00) + event | mockData.ts NUDGES |
| 5 | Super Agent | תיזמון, ניהול, coordination | 24/7 event-driven | CoordinatorAgents.tsx |

**קובץ UI:** `src/pages/coordinator/CoordinatorAgents.tsx`

---

## קטלוג שירותים — מבנה

**5 תחומי ליבה** (מבוסס מסמך ממשלתי):
1. שייכות ומשמעות — מועדונים, התנדבות, תרבות
2. תפקוד ובריאות — כושר, קוגניציה, תזונה, מניעת נפילות
3. חוסן אישי וכלכלי — מיצוי זכויות, תמיכה נפשית, עזרה ביתית
4. דיגיטציה תומכת — סמארטפון, תמיכה טכנית, טלמדיסין
5. מוצרים מסייעים — שמיעה, נפילות, טכנולוגיה

**רמות שירות:**
- מקומי (ירוק) — ברשות המקומית
- אזורי (צהוב) — שיתוף בין רשויות
- ארצי (אדום) — זמין לכל האזרחים

**קובץ:** `src/pages/citizen/ServicesCatalog.tsx`

---

## SDI / RDI — מדדי הידרדרות

- **RDI** (Risk Deterioration Index) — ככל שגבוה = סיכון גדול. מעל 1.3 = דורש התערבות.
- **SDI** (Service Diversity Index) — כמה שירותי מניעה פעילים. 0 = לא משתמש. יעד: 17+.
- **על בסיס:** ימים ללא פעילות, ביטולים, בדידות, שינויים תפקודיים.

---

## כללי עיצוב

- **צבע ראשי:** #1B3A5C (כחול כהה)
- **כיוון:** RTL, עברית
- **פונט:** Heebo / system
- **אין אימוגי** בממשק (חוץ מצ'אט AI שזה טבעי)
- **Accessibility:** כפתורים min 48px, טקסט קריא, ניגודיות
- **ספריות:** Tailwind CSS, shadcn/ui, lucide-react, recharts, sonner, react-router-dom
- **שם "מלווה חברתית"** — לא "מתאמת"

---

## כללי עבודה

1. RTL, עברית
2. לא לשבור מה שעובד — להוסיף/לשפר
3. אחרי כל שינוי: `npm run build` → `git add -A` → `git commit` → `git push`
4. GitHub Pages מתעדכן אוטומטית
5. בדיקה: לפתוח https://avi1840.github.io/sal-ishi-v2/ ולוודא שעובד

---

## קהלי יעד

| קהל | מה להציג | מתי |
|-----|----------|------|
| צוות האצה (מלוות חברתיות) | `/coordinator` + SAL-ISHI-SIUD | יום שני |
| האקתון AWS GenAI | `/hackathon` + demo flow כל הממשקים | 23/06/26 |
| בכירים (יואב, אורי, דניאל, דורית) | `/executive` + demo flow | חלופה ג' |

---

## בעיות ידועות לתיקון

1. SAL-ISHI-SIUD — לוודא שה-HashRouter עובד אחרי deploy (routes כמו `/#/deterioration`)
2. דף הבית sal-ishi-v2 — צריך להיות יותר premium/מרשים
3. דף האקתון — צריך מצגת (לא timer). slides: אתגר → פתרון → דמו → ערך
4. ממשק אזרח — כרטיסים קטנים, אין תמונות. reference: libi-sal-ishi.vercel.app
5. לוודא שכל "מתאמת" הוחלפה ל-"מלווה חברתית"

---

## מה הכי חשוב עכשיו

**להאצה (מחר):**
- `/coordinator` שעובד חלק עם ניווט ברור
- SDI/RDI מוסבר
- קטלוג סל נגיש
- SAL-ISHI-SIUD עובד

**להאקתון:**
- דף פיץ' מרשים (לא gimmick)
- AWS badges visible
- Agentic Flow visualization
- Matching explainability
- 5 agents page
