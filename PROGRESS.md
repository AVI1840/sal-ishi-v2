# סל אישי v2 — מפת מצב

> עודכן: 2026-06-04

## Branches

| Branch | מטרה | Deploy |
|--------|------|--------|
| `main` | פיילוט אמיתי (286 אזרחים, ירושלים) | https://avi1840.github.io/sal-ishi-v2/ |
| `hackathon-aws` | האקתון AWS GenAI (23/06/26) | TBD (Vercel/Netlify) |

## מה בוצע — main

- [x] 5 ממשקים: אזרח, מתאמת, ניהולי, ספקים, national (27 דפים)
- [x] כפתור נסתר (3 קליקים) → SAL-ISHI-SIUD
- [x] services-research: קטלוג 102 שירותים, 5 שכונות, אלגוריתם התאמה
- [x] FeedbackModal + FAB
- [x] ErrorBoundary, ScrollToTop, RouteFallback

## מה בוצע — hackathon-aws (לא ב-main)

- [x] צ'אט AI (לימור) עם typing effect + quick actions
- [x] Agentic Flow ויזואלי (5 צעדים) בדשבורד מתאמת
- [x] תמלול דמו באינטייק (הקלטה → עיבוד → תובנות)
- [x] שדרוג UX ממשק אזרח (gradient, אנימציות, AI badge)
- [x] Badge "Powered by Amazon Bedrock" בפוטר

## תוכנית עבודה — הבא בתור

### עדיפות 1 — שירותים אמיתיים ב-UI
- [x] השלם services-catalog.json ל-102 שירותים
- [ ] צור `src/data/realServices.ts` — ייבוא מה-JSON + החלפת mock
- [ ] סינון לפי שכונה בממשקי citizen + coordinator
- [ ] קומפוננטת דירוג (1-5 כוכבים + "היית ממליץ?" + טקסט)
- [ ] דף "מיפוי שירותים" עם רשימה מסוננת

### עדיפות 2 — שדרוג UI
- [ ] ממשק אזרח חם יותר (תמונות, הסבר AI)
- [ ] "לפני/אחרי" — מה היה vs מה המערכת נותנת

### עדיפות 3 — האקתון (ב-hackathon-aws branch)
- [ ] דף /hackathon עם pitch 4 דקות
- [ ] ודא AWS badges נראים (Bedrock, Transcribe, Personalize)
- [ ] Cherry-pick services-catalog ל-hackathon-aws

## טיפים לשיחה הבאה

1. תגיד: "קרא PROGRESS.md" → נכנס ישר לעבודה
2. תגיד: "עבוד על main" או "עבוד על hackathon" → ברור על מה עובדים
3. אחרי כל שינוי: build → commit → push
