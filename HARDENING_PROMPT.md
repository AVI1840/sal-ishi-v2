# Product Hardening Prompt — Ready for Claude Code

Copy-paste this entire prompt to Claude Code.

---

You are acting as Head of Product Hardening and Demo Readiness.

The platform is entering final stabilization before an AWS Hackathon.

IMPORTANT:
- Do NOT redesign the product.
- Do NOT change architecture.
- Do NOT change matching logic.
- Do NOT change recommendation logic.
- Do NOT change routing.
- Do NOT create new screens.
- Do NOT create new concepts.

Your mission: Increase Product Maturity, Trust, Clarity, Accessibility, Demo Reliability — while preserving production readiness.

## P0 TASKS (IMPLEMENT NOW)

### 1. VIA Strength Icons
File: `src/pages/coordinator/CoordinatorPatientDetail.tsx`
The VIA strengths section currently shows letter abbreviations (W/C/J/T/M/H).
Replace with lucide-react icons:
- wisdom → Brain
- courage → Shield  
- justice → Scale
- transcendence → Sparkles
- temperance → Leaf
- humanity → Heart

### 2. Executive Cleanup
File: `src/pages/executive/ExecutiveOverview.tsx`
- Remove the "בקרה ועצירה (חירום)" control panel block entirely
- Replace the decorative PILOTS dot-map with an honest text list:
  ```
  פסגת זאב — פעיל (286)
  תלפיות מזרח — מתוכנן
  בית חנינא — מתוכנן
  נווה יעקב — מתוכנן
  עין כרם — מתוכנן
  ```

### 3. Service Images Wiring
File: `src/lib/serviceImages.ts` already maps categories to images.
Verify that `CitizenHome.tsx`, `CitizenServices.tsx`, and `CitizenServiceDetail.tsx` 
render images from this map with a gradient fallback when image doesn't load.

### 4. SubsidyBadge Component
Create: `src/components/shared/SubsidyBadge.tsx`
Props: `tier: 100 | 50 | 20`
Display:
- 100 → "חינם 100%" green badge
- 50 → "מסובסד 50%" blue badge  
- 20 → "השתתפות 20%" gray badge
Wire into service cards (CitizenServices, CitizenHome, CitizenServiceDetail).
Subsidy logic by category:
- category 1 (שייכות) + 2 (בריאות) = 100%
- category 3 (חוסן) + 4 (דיגיטל) = 50%
- category 5 (בית) = 20%

### 5. Second Citizen Profile for Demo Contrast
In `src/data/mockData.ts`, ensure CITIZENS[2] (יוסף כהן, 72, healthy, active) 
is distinct enough from CITIZENS[0] (שרה כהן, 78, high-risk, lonely) that
calling `matchServicesForCitizen(CITIZENS[2])` returns a visibly different basket.
No code change needed if data is already different — just verify and note for demo.

### 6. Landing Problem Statement
File: `src/pages/DemoHome.tsx`
Find the hero subtitle/problem text. Ensure it clearly states:
"₪5 מיליארד בשנה. 80% הולך לשירותי בית. לא למניעה."
If not already there, add as a prominent line.

## P1 TASKS

### 7. Accessibility
- In all `src/pages/citizen/*`: verify no text smaller than `text-sm` (14px)
- All buttons/links: min-h-12 (48px)
- Focus states: already added globally in index.css ✅

### 8. Consistency
- Cards: p-5, rounded-xl, border border-gray-100
- Badges: text-xs, px-2.5, py-1, rounded-lg, border
- Typography: headings text-lg font-bold, body text-sm

## CONSTRAINTS
- `npm run build` must pass after each change
- Do not change matchingEngine.ts
- Do not change routing (App.tsx routes)
- Do not change data model (types.ts)
- RTL, Hebrew, #1B3A5C primary
- No emoji in any non-chat UI

## AFTER COMPLETION
Report:
- Files changed
- What was intentionally left unchanged
- Build status
- Any data inconsistencies found

Push to main when done.
