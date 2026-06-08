/**
 * serviceImages.ts
 * ─────────────────
 * Central image registry for service cards.
 *
 * getServiceImage(service) → image path | undefined
 *   Returns undefined when no image exists — UI should render gradient fallback.
 *
 * getCategoryGradient(category) → Tailwind gradient classes
 *   Always returns a valid gradient — safe to use as fallback everywhere.
 *
 * getCategoryIcon(category) → lucide icon name string
 *   For use inside gradient fallbacks.
 */

export interface ServiceImageInfo {
  image?: string;    // path under /public, e.g. "./images/choir.png"
  gradient: string;  // Tailwind bg-gradient-to-br from-X to-Y
  gradientDark: string; // darker variant for overlays
}

// ─── Category defaults ───────────────────────────────────────────

const CATEGORY_IMAGE: Record<number, string | undefined> = {
  1: "./images/community-club.png",   // שייכות ומשמעות
  2: "./images/exercise-weights.png", // בריאות ותפקוד
  3: "./images/volunteering.png",     // חוסן אישי וכלכלי
  4: "./images/telemedicine.png",     // נגישות דיגיטלית
  5: undefined,                      // מוצרים מסייעים — gradient only
};

const CATEGORY_GRADIENT: Record<number, { light: string; dark: string }> = {
  1: { light: "from-blue-400 to-blue-600",     dark: "from-blue-600 to-blue-800"     },
  2: { light: "from-emerald-400 to-emerald-600", dark: "from-emerald-600 to-emerald-800" },
  3: { light: "from-amber-400 to-amber-600",   dark: "from-amber-600 to-amber-800"   },
  4: { light: "from-purple-400 to-purple-600", dark: "from-purple-600 to-purple-800" },
  5: { light: "from-gray-400 to-gray-600",     dark: "from-gray-600 to-gray-800"     },
};

// ─── Subcategory keyword overrides ───────────────────────────────
// When a service name/subcategory contains these patterns → use specific image

const KEYWORD_IMAGE: { pattern: RegExp; image: string }[] = [
  { pattern: /שיר|מקהלה|מוזיק|זמר/i,         image: "./images/choir.png"            },
  { pattern: /ציור|אמנות|יצירה|קרמיק/i,       image: "./images/art-class.png"        },
  { pattern: /הליכה|קבוצת הלי/i,              image: "./images/exercise-balls.png"   },
  { pattern: /התעמלות|כושר|ספורט|כדור|כדורי/i, image: "./images/exercise-weights.png" },
  { pattern: /סמארטפון|דיגיטל|מחשב|טלמד/i,   image: "./images/telemedicine.png"     },
  { pattern: /מועדון|חברת|מתנ.?ס/i,           image: "./images/community-club.png"   },
  { pattern: /התנדב|מיצוי|עזרה|קהיל/i,        image: "./images/volunteering.png"     },
];

// ─── Public API ──────────────────────────────────────────────────

interface ServiceLike {
  category: number;
  name?: string;
  subcategory?: string;
  notes?: string;
}

/**
 * Returns the best available image for a service.
 * Checks subcategory keywords first, then category default.
 * Returns undefined when no real image exists (use gradient fallback).
 */
export function getServiceImage(service: ServiceLike): string | undefined {
  const text = `${service.name ?? ""} ${service.subcategory ?? ""} ${service.notes ?? ""}`;

  for (const { pattern, image } of KEYWORD_IMAGE) {
    if (pattern.test(text)) return image;
  }

  return CATEGORY_IMAGE[service.category];
}

/**
 * Tailwind gradient string for a category.
 * Always returns a value — safe as unconditional fallback.
 */
export function getCategoryGradient(category: number, dark = false): string {
  const g = CATEGORY_GRADIENT[category] ?? CATEGORY_GRADIENT[1];
  return `bg-gradient-to-br ${dark ? g.dark : g.light}`;
}

/**
 * Full image info for a service — image + gradient + darkGradient.
 */
export function getServiceImageInfo(service: ServiceLike): ServiceImageInfo {
  const g = CATEGORY_GRADIENT[service.category] ?? CATEGORY_GRADIENT[1];
  return {
    image: getServiceImage(service),
    gradient: `bg-gradient-to-br ${g.light}`,
    gradientDark: `bg-gradient-to-br ${g.dark}`,
  };
}
