/**
 * עבודה בלי אינטרנט: רישום ה-service worker (public/sw.js) והכנה מראש של
 * המטמון. "הכנה לעבודה בלי אינטרנט" טוענת את כל האפליקציות (אזרח ומלווה,
 * מטה, שטח) ואת הקבצים שלהן, כך שההדגמה עוברת גם בלי רשת באולם.
 */

export function registerServiceWorker(): void {
  if (import.meta.env.DEV || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((e) => console.warn("[offline] service worker לא נרשם", e));
  });
}

async function warm(url: string, seen: Set<string>): Promise<void> {
  const abs = new URL(url, location.href).href;
  if (seen.has(abs)) return;
  seen.add(abs);
  const res = await fetch(abs, { cache: "reload" });
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("text/html")) return;
  const html = await res.text();
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]).filter((r) => !r.startsWith("http") && !r.startsWith("#") && !r.startsWith("data:"));
  await Promise.all(refs.map((r) => fetch(new URL(r, abs).href).then(() => seen.add(new URL(r, abs).href)).catch(() => undefined)));
}

export async function prepareOffline(): Promise<string> {
  if (import.meta.env.DEV || !("serviceWorker" in navigator)) return "העבודה בלי אינטרנט זמינה רק באתר המפורסם, בדפדפן שתומך בה.";
  await navigator.serviceWorker.register("./sw.js");
  await navigator.serviceWorker.ready;
  const seen = new Set<string>();
  for (const page of ["./", "./hq/", "./field/", "./app-settings.json"]) {
    await warm(page, seen).catch(() => undefined);
  }
  for (const entry of performance.getEntriesByType("resource")) {
    if (entry.name.startsWith(location.origin)) await fetch(entry.name).catch(() => undefined);
  }
  // גיליון הגופנים מ-Google: דרך ה-service worker, כדי שהעיצוב יישאר גם בלי רשת.
  for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href^="https://fonts."]')) {
    await fetch(link.href, { mode: "no-cors" }).catch(() => undefined);
  }
  return `מוכן לעבודה בלי אינטרנט: ${seen.size} קבצים נשמרו במכשיר. כדאי לפתוח פעם אחת את המטה והשטח עם רשת, ואז לבדוק במצב טיסה.`;
}
