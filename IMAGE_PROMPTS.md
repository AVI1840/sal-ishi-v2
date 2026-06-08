# פרומפטים לתמונות שירותים — Midjourney / DALL-E / Ideogram

## כללי סגנון
- **סגנון:** צילום טבעי, חם, אור רך, ישראלי
- **קהל:** אזרחים ותיקים 65+ — מגוון אתני (אשכנזי, מזרחי, ערבי, חרדי)
- **פורמט:** 16:9, רזולוציה 1200x675px, JPEG
- **טון:** חיובי, פעיל, לא patronizing. אנשים מבוגרים שנראים שמחים ופעילים.
- **רקע:** ישראלי (מתנ"ס, פארק ירושלים, שכונה, בית)

---

## קטגוריה 1 — שייכות ומשמעות (belonging)

### מועדון חברתי שכונתי
```
Warm photo of elderly Israeli adults sitting together at a community center table, drinking coffee and laughing. Mixed ethnicities. Natural light from window. Jerusalem neighborhood building visible through window. Warm colors, candid moment. 16:9 aspect ratio.
```

### מועדון גברים — ספורט
```
Photo of elderly Israeli men playing table football (foosball) at a community center, smiling and competitive. Casual sportswear. Bright indoor space. 16:9.
```

### התנדבות קהילתית
```
Elderly Israeli woman helping pack food boxes at a community volunteer center. She looks purposeful and content. Other volunteers in background. Natural light. 16:9.
```

### חוגי יצירה — ציור
```
Close-up of elderly hands painting watercolors at an art workshop. Paint brushes, colorful palette visible. Warm studio lighting. Other participants blurred in background. 16:9.
```

### מקהלה / שירה
```
Small group of elderly Israelis singing together from song sheets, led by a conductor. Intimate room, music stands. Joyful expressions. 16:9.
```

---

## קטגוריה 2 — תפקוד ובריאות (health)

### בריכה / הידרותרפיה
```
Elderly Israeli woman in a warm indoor pool doing aqua therapy exercises. Clear blue water, natural light from skylights. Calm, therapeutic atmosphere. 16:9.
```

### התעמלות קבוצתית
```
Group of elderly Israelis doing gentle exercises in a bright community gym, led by a young instructor. Balance balls, light weights visible. Everyone smiling. 16:9.
```

### פיזיותרפיה בבית
```
Physiotherapist helping elderly Israeli man do leg exercises at home. Living room setting, natural light, family photos on wall. Professional but warm. 16:9.
```

### מניעת נפילות
```
Occupational therapist installing grab bars in an elderly person's bathroom. Tools visible, safety-focused. Clean, modern Israeli apartment. 16:9.
```

### תזונה
```
Elderly Israeli couple preparing a healthy Mediterranean meal together in their kitchen. Fresh vegetables, olive oil, herbs. Warm kitchen lighting. 16:9.
```

---

## קטגוריה 3 — חוסן אישי (resilience)

### מיצוי זכויות
```
Elderly Israeli woman sitting with a social worker at a desk, reviewing documents together. Official-looking papers, reading glasses. Professional but warm office. 16:9.
```

### תמיכה נפשית
```
Elderly Israeli man talking to a therapist in a warm, comfortable room. Two armchairs, soft lighting, plant on table. Intimate, safe space feeling. 16:9.
```

### שכונה תומכת
```
Community volunteer knocking on door of elderly person's apartment, holding a small care package. Jerusalem stone building, warm afternoon light. 16:9.
```

---

## קטגוריה 4 — דיגיטל (digital)

### הדרכת סמארטפון
```
Young volunteer teaching elderly Israeli woman to use smartphone. They sit side by side at a library table, both looking at screen. Woman wearing reading glasses, looking focused and engaged. 16:9.
```

### טלמדיסין
```
Elderly Israeli man having video call with doctor on tablet, sitting in his living room armchair. Doctor visible on screen. Comfortable home setting. 16:9.
```

---

## קטגוריה 5 — מוצרים מסייעים (assistive)

### לחצן מצוקה
```
Close-up of elderly person's wrist wearing a simple emergency button bracelet. Hand resting on armchair. Soft focus on comfortable home in background. 16:9.
```

### הליכון / ציוד
```
Modern lightweight walker parked next to a park bench in Jerusalem. Elderly person (back view) sitting on bench looking at garden. Peaceful morning light. 16:9.
```

---

## הוראות שמות קבצים

שמור כל תמונה ב-`public/services/` בפורמט:
```
public/services/belonging-club.jpg
public/services/belonging-sports.jpg
public/services/belonging-volunteer.jpg
public/services/belonging-art.jpg
public/services/belonging-choir.jpg
public/services/health-pool.jpg
public/services/health-gym.jpg
public/services/health-physio.jpg
public/services/health-safety.jpg
public/services/health-nutrition.jpg
public/services/resilience-rights.jpg
public/services/resilience-therapy.jpg
public/services/resilience-community.jpg
public/services/digital-smartphone.jpg
public/services/digital-telemedicine.jpg
public/services/assistive-button.jpg
public/services/assistive-walker.jpg
```

## חיבור לקוד

ב-`serviceCatalog.ts` או `realServices.ts`, הוסף:
```typescript
image: "/services/belonging-club.jpg"
```

הקוד כבר מטפל ב-fallback (gradient) כשאין image.
