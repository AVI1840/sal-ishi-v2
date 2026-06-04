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
- [x] realServices.ts — ממיר 102 שירותים + filterServices + getRecommendedForProfile
- [x] CitizenServices — חיפוש + סינון קטגוריה + שכונה + עלות + תגיות
- [x] CoordinatorServices (/coordinator/services-map) — מיפוי + פאנל פרטים + stats
- [x] CitizenHome — שירותים אמיתיים מקטלוג, AI badge, לפני/אחרי
- [x] CitizenServiceDetail — שירות אמיתי, נגישות, שפות, דירוג
- [x] ServiceRating — כוכבים 1-5 + ממליץ + טקסט + localStorage
- [x] Hackathon pitch page (/hackathon) — טיימר 4 דקות, AWS services, פיץ' מלא
- [x] DemoHome — כפתור האקתון בולט

## מה בוצע — hackathon-aws (לא ב-main)

- [x] צ'אט AI (לימור) עם typing effect + quick actions
- [x] Agentic Flow ויזואלי (5 צעדים) בדשבורד מתאמת
- [x] תמלול דמו באינטייק (הקלטה → עיבוד → תובנות)
- [x] שדרוג UX ממשק אזרח (gradient, אנימציות, AI badge)
- [x] Badge "Powered by Amazon Bedrock" בפוטר

## תוכנית עבודה — הבא בתור

### עדיפות 1 — שירותים אמיתיים ב-UI
- [x] השלם services-catalog.json ל-102 שירותים
- [x] צור `src/data/realServices.ts`
- [x] סינון לפי שכונה בממשקי citizen + coordinator
- [x] קומפוננטת דירוג ServiceRating
- [x] דף "מיפוי שירותים" /coordinator/services-map

### עדיפות 2 — שדרוג UI
- [x] ממשק אזרח עם שירותים אמיתיים + AI badge
- [x] "לפני/אחרי" בממשק אזרח
- [ ] תקן דפים שבורים בפורטל ספקים

### עדיפות 3 — האקתון
- [x] דף /hackathon עם pitch + טיימר 4 דקות
- [x] AWS badges (Bedrock, Transcribe, Personalize)
- [ ] Cherry-pick services-catalog ל-hackathon-aws branch

## טיפים לשיחה הבאה

1. תגיד: "קרא PROGRESS.md" → נכנס ישר לעבודה
2. תגיד: "עבוד על main" או "עבוד על hackathon" → ברור על מה עובדים
3. אחרי כל שינוי: build → commit → push
