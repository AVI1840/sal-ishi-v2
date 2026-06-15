# תוכנית שיפור מקצה-לקצה — "סל אישי v2" | מוכנות להצגה (האצה + האקתון AWS)

> מסמך העברה לישום ב-Kiro וב-Claude Code (Opus 4.6). עודכן: 2026-06-15.

## Context

`sal-ishi-v2` (React 18 + TS + Vite + Tailwind + shadcn/ui, RTL, GitHub Pages) — מערכת AI להתאמת שירותי מניעה לאזרחים ותיקים 65+ במסגרת רפורמת הסיעוד (החלטות ממשלה 127/150). המערכת תוצג **בנפרד** לשני קהלים: צוות האצה (ערך תפעולי למלווה) והאקתון AWS GenAI (Hero של GenAI). הדרישה: מערכת אחת קוהרנטית, מדויקת, נגישה ומרשימה — "מוכנה לישום".

**ממצא מפתח (מאומת בקוד):** המערכת בנויה ברובה. `typecheck` עובר נקי, וכל רכיבי ה-Hero חיים ופעילים:
- `src/lib/ai.ts` — client מלא עם streaming SSE, קריאת `VITE_AI_ENDPOINT`, fallback scripted. **מוכן לתדלוק.**
- `src/components/shared/LiveAgenticFlow.tsx` — flow מונפש 5-שלבי מתופעל בלחיצה עם streaming. מוטמע בדשבורד המלווה.
- `src/components/shared/MatchExplainability.tsx` + `PersonalReasonCard.tsx` — פירוק 5 שכבות (bars, משקלים, צבעי-סף, סיבות). מחובר ל-`matchingEngine.ts`.
- `src/components/GuidedDemo.tsx` + `AutoDemoOverlay.tsx` — דמו מודרך 8 שלבים + סיור אוטומטי, עם persistence ו-keyboard controls.
- `src/pages/DemoHome.tsx` ו-`Hackathon.tsx` — דף בית פרימיום + פיץ' slide-style.

**המסקנה:** העבודה היא **ליטוש, עקביות ונגישות** — לא בנייה. ההבדל בין "מרשים" ל"מנצח".

---

## חוקי עבודה (Claude ו-Kiro)

- RTL, עברית. צבע ראשי `#1B3A5C`. פונט Heebo/system.
- **אין אימוגי בשום ממשק** — היחיד המותר: בועות צ'אט AI (לימור). החלף ב-`lucide-react`.
- נגישות (תקן 5568 / WCAG AA, קהל 65+): טקסט מינימלי `text-xs`; יעדי-מגע מינימום 44px.
- שמות קנוניים: אזרחית = **שרה כהן**, מלווה = **רונית**, AI = **לימור**. תפקיד = **"מלווה חברתית"** (לא "מתאמת").
- מודל נתונים קנוני: **286** = כלל הפיילוט · **75** = תיק מלווה בודדת · **5 שכונות** · ארנק = **32 יח'/חודש, ניצול 71% → 23 נוצלו, 9 נותרו**.
- אחרי כל אצווה: `npm run build` חייב לעבור. אל תיגע ב-`matchingEngine.ts` (לוגיקה) או ב-routing.

---

## P0 — עקביות ואמינות (קוטל-מהימנות בדמו · זול · השפעה גבוהה)

### P0.1 — אי-עקביות ארנק (באג) — **Kiro**
`src/pages/citizen/CitizenChat.tsx:20` אומר "יתרה 32 מתוך 43 · תפוגה 47 יום · 2 שמורות" — סותר את `CitizenHome.tsx:34-36` ו-`CitizenProfile.tsx:28-31` (32 סך, 23 נוצלו, 9 נותרו). **תיקון:** "יתרה: 9 יחידות מתוך 32 · נוצלו 23 (71%) · תפוגה סוף החודש".

### P0.2 — סוויפ אימוגי → lucide — **Kiro**
- `CoordinatorPatientDetail.tsx:285-286` — 🏆 → `<Award/>`.
- `ProviderDashboard.tsx:142` — 👋 → להסיר.
- `src/data/constants.ts:30` — `icon: "💰"` → `"Wallet"`.
- לוודא `mockData.ts` NUDGES ו-`CoordinatorBookings.tsx` (`emoji/serviceEmoji` ריקים) — להסיר שדה אם לא בשימוש.

### P0.3 — אחידות מונח "מלווה חברתית" — **Kiro**
- `CoordinatorDashboard.tsx:2` ("דשבורד מתאמת"), `Assistant.tsx:154` ("מתאמת") → "מלווה חברתית". `grep "מתאמת"` בכל `src`.

### P0.4 — ביקורת סיפור נתונים — **Claude**
וידוא 286/75/5-שכונות עקבי בכל KPI; סריקת ביקורת למספרים שנשרו.

---

## P1 — נגישות ו-UI/UX מושלמת

### P1.1 — יעדי-מגע < 44px — **Kiro**
`CoordinatorDeterioration.tsx:90-97` (`w-8 h-8`), `CoordinatorDashboard.tsx:354`, `CoordinatorPatientDetail.tsx:51` (`w-9 h-9`) → מינימום `h-11 w-11` + `aria-label`.

### P1.2 — גדלי טקסט זעירים — **Kiro**
30+ מופעי `text-[10px]`/`text-[11px]` (בעיקר `CoordinatorServices.tsx`, `CoordinatorPatientDetail.tsx`) → `text-xs` מינימום.

### P1.3 — שדרוג Provider Dashboard לפרימיום — **Claude**
`src/pages/providers/ProviderDashboard.tsx` (היחיד "בסיסי") → רמת `DemoHome`/`ExecutiveOverview`: hero מותג, KPI cards עם trend, ריווח וטיפוגרפיה עקביים.

### P1.4 — ליטוש focus/hover/transition — **Claude**
`focus-visible` ring על כל כפתור/Link לאורך golden path — נגישות מקלדת בדמו.

---

## P1 — חוסן דמו

### P1.5 — Demo Safe לקישורים חיצוניים — **Claude**
`CitizenServiceDetail.tsx:153`, `CoordinatorServices.tsx:129` (`<a target=_blank>`) — להסיט מה-golden path הראשי או tooltip. `FeedbackModal.tsx:11` — try/catch שקט שלא חוסם UI.

### P1.6 — איחוד מערכות הדמו — **Claude**
Req 5 ב-spec: למנוע ש-`GuidedDemo` ו-`AutoDemoOverlay` פעילים יחד (namespace `sal_demo_`, API מאוחד `startAutoDemo`/`startGuidedDemo`/`stopAllDemos`).

---

## P1 — "מוכן לתדלוק" Bedrock (המחשוב מתניע בהאקתון)

### P1.7 — אימות חוזה SSE — **Claude**
ב-`src/lib/ai.ts` לוודא שהפענוח (`json.delta?.text`, `[DONE]`, `choices[0].delta.content`) תואם **בדיוק** ל-Lambda שב-`BEDROCK_REQUIREMENTS.md`. ליצור `.env.example` עם `VITE_AI_ENDPOINT=`. בדיקה מול mock SSE.

### P1.8 — נרטיב "Powered by Amazon Bedrock" עקבי — **Kiro**
Badge/footer אחיד בצ'אט, LiveAgenticFlow ואינטייק.

---

## P2 — חוב טכני

- **מחיקת `src/lib/matching.ts`** (legacy, לא מיובא — `matchingEngine.ts` היחיד בשימוש). — **Claude**.
- **איחוד `components/common/{Avatar,Chip}` מול `components/shared/{Avatar,Chip}`** — `shared/` מקור-אמת, החלפת imports, מחיקת `common/`. — **Kiro**.
- **imports מתים:** `CoordinatorDeterioration.tsx` (`TrendingDown`, `Home`), `CoordinatorAlgorithm.tsx` (`CITIZENS` בזבזני). — **Kiro**.

---

## P3 — SAL-ISHI-SIUD (deploy שבור)

base path `/SAL-ISHI-SIUD/` לא תואם + HashRouter (`/#/deterioration`). תיקון `base` ב-build. עדיפות נמוכה — sal-ishi-v2 עומד בפני עצמו. — **Claude**.

---

## חלוקת עבודה — Claude (Opus 4.6) מול Kiro

| Claude — שיפוט/ארכיטקטורה/נרטיב | Kiro — מכני/נפחי/חוזר |
|---|---|
| P0.4 ביקורת עקביות נתונים | P0.1 תיקון טקסט ארנק |
| P1.3 שדרוג Provider לפרימיום | P0.2 סוויפ אימוגי→lucide |
| P1.4 ליטוש focus/hover | P0.3 סוויפ "מלווה חברתית" |
| P1.5/P1.6 חוסן דמו + איחוד overlays | P1.1 יעדי-מגע 44px |
| P1.7 אימות חוזה SSE + .env.example | P1.2 סוויפ גדלי טקסט |
| P2 מחיקת matching.ts | P1.8 badge Bedrock אחיד |
| P3 debug deploy SIUD | P2 איחוד Avatar/Chip + ניקוי imports |

---

## אימות (end-to-end לפני ההצגה)

1. `npm run build` — tsc נקי (baseline: עובר).
2. golden path 8 שלבים: `/` → `/citizen` → `/citizen/services` → `/coordinator` → `/coordinator/agents` → `/coordinator/intake` → `/coordinator/algorithm` → `/executive`.
3. Hero: `LiveAgenticFlow` ב-`/coordinator` — streaming עד תוצאה.
4. Explainability: דף שירות אזרח — 5 שכבות + bars + סיבה + צבע-סף.
5. עקביות: אפס אימוגי, ארנק 9/32 בכל המסכים, "מלווה חברתית" אחיד, 286/75 נכון.
6. נגישות: ניווט מקלדת + focus גלוי; טקסט ≥ `text-xs`; כפתורים ≥ 44px.
7. דמו אוטומטי: 60ש+ ללא התנגשות overlay.
8. תדלוק Bedrock: `VITE_AI_ENDPOINT` דמה → stream אמיתי; הסרה → fallback חלק.
9. (P3) SIUD נטען ומנווט אחרי deploy.

## סיכון
- Bedrock תלוי ב-IT — fallback scripted חובה כברירת-מחדל.
- `mockData.ts` = מקור-אמת יחיד — שינויי נתונים זהירים.
- P0/P1 הם string/style בלבד — סיכון רגרסיה נמוך; build אחרי כל אצווה.
