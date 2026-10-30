// עבודה בלי אינטרנט (0.5): שומר את האפליקציה במטמון של הדפדפן.
// דפים והגדרות: קודם רשת, ובלי רשת מהמטמון. קבצי בנייה (עם hash): קודם מטמון.
// התחום הוא התיקייה של הקובץ, כך ש-/next/ ו-/ לא נוגעים זה בזה.
// התאמה במטמון בלי Vary: שרת ששולח "Vary: Origin" היה מפיל את קבצי המודול (שנשלחים
// עם Origin) בלי רשת, כי ההכנה מראש שמרה אותם בלי. קבצי בנייה עם hash לא משתנים.

const CACHE = "sal-ishi-v05";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html", "./app-settings.json"]).catch(() => undefined)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("sal-ishi-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const networkFirst = async (request) => {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const hit = await cache.match(request, { ignoreSearch: true, ignoreVary: true });
    if (hit) return hit;
    if (request.mode === "navigate") {
      const dir = new URL("./", request.url).href;
      return (await cache.match(dir, { ignoreVary: true })) || (await cache.match(dir + "index.html", { ignoreVary: true })) || Response.error();
    }
    return Response.error();
  }
};

const cacheFirst = async (request) => {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request, { ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(request);
  // גיליון הגופנים של Google נטען בלי CORS (תשובה אטומה): שומרים גם אותו.
  if (res.ok || res.type === "opaque") cache.put(request, res.clone());
  return res;
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    // גופנים של Google: קודם מטמון, כדי שהעיצוב יישאר גם בלי רשת.
    if (url.hostname.endsWith("gstatic.com") || url.hostname.endsWith("googleapis.com")) event.respondWith(cacheFirst(request));
    return;
  }
  const hashed = /\/assets\/.+-[A-Za-z0-9_-]{8,}\.(js|css|woff2?|png|jpe?g|svg|webp)$/.test(url.pathname);
  event.respondWith(hashed ? cacheFirst(request) : networkFirst(request));
});
