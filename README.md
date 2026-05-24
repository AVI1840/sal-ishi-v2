# סל אישי v2 — פלטפורמת שירותים ממשלתית לאזרחים ותיקים

## 🎯 על הפרויקט

מערכת "סל אישי" היא פלטפורמה ממשלתית לליווי אזרחים ותיקים בישראל.
פיילוט ירושלים — ביטוח לאומי + משרד האוצר.

- 736 אזרחים בני 65-92
- 5 מתאמות חברתיות
- 24 ספקי שירות

## 🚀 הרצה

```bash
npm install
npm run dev
```

## 📂 מודולים

| מודול | נתיב | תיאור |
|-------|------|--------|
| בית הדמו | `/` | Module Switcher — בחירת חוויה |
| אפליקציית אזרח | `/citizen` | Mobile-first, RTL, ארנק + שירותים |
| דשבורד מתאמת | `/coordinator` | Desktop, KPIs, AI recommendations |
| דשבורד ניהולי | `/executive` | מבט על, מפת פיילוטים, בקרה |
| פורטל ספקים | `/providers` | הזמנות, שירותים, תשלומים |

## 🧱 Stack

- React 18 + TypeScript (strict)
- Vite 6
- TailwindCSS 3.4 + tailwindcss-animate
- Radix UI (Dialog, Tabs, Progress, Tooltip)
- React Router v6
- Recharts
- Sonner (toasts)
- Lucide React (icons)
- TanStack Query

## 🎨 Design System

- Brand: `#1B3A5C` (deep navy)
- Font: Heebo
- Direction: RTL
- Radius: 0.75rem
- Semantic colors: primary, success, warning, destructive, info

## ✅ Scripts

```bash
npm run dev        # Development server
npm run build      # Production build
npm run typecheck  # TypeScript check
npm run preview    # Preview production build
```
