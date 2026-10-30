/**
 * איפוס ההדגמה בלחיצה אחת: מוחק במכשיר הזה רק את הנתונים של 0.5 (האזרח,
 * המלווה, השטח, המטה, המשוב ופנקס הלמידה). הנתונים של 0.4 לא נמחקים.
 */

import { VERSIONED_NAMESPACES } from "@sal-ishi/core";
import { resetPilot } from "./store";
import { seedDemo } from "./demoSeed";

const IMPORT_MARK = "__imported_from__";

export async function resetDemo(): Promise<void> {
  resetPilot();
  seedDemo();
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && VERSIONED_NAMESPACES.some((ns) => k.startsWith(ns + ":"))) localStorage.removeItem(k);
    }
    for (const ns of VERSIONED_NAMESPACES) localStorage.setItem(`${ns}:${IMPORT_MARK}`, JSON.stringify({ from: "reset", keys: [] }));
  } catch {
    /* אחסון חסום */
  }
  if (typeof indexedDB === "undefined") return;
  // לא מוחקים את המאגר עצמו (לשונית פתוחה של השטח או המטה הייתה חוסמת את המחיקה).
  // מרוקנים אותו, ומסמנים שהייבוא מ-0.4 כבר נעשה, כדי שהאיפוס יחזיר מצב נקי.
  await Promise.all(
    VERSIONED_NAMESPACES.map(
      (name) =>
        new Promise<void>((resolve) => {
          const req = indexedDB.open(name, 1);
          req.onupgradeneeded = () => req.result.createObjectStore("kv");
          req.onerror = () => resolve();
          req.onsuccess = () => {
            const db = req.result;
            try {
              const tx = db.transaction("kv", "readwrite");
              const store = tx.objectStore("kv");
              store.clear();
              store.put({ from: "reset", at: new Date().toISOString(), keys: [] }, IMPORT_MARK);
              tx.oncomplete = () => {
                db.close();
                resolve();
              };
              tx.onerror = () => {
                db.close();
                resolve();
              };
            } catch {
              db.close();
              resolve();
            }
          };
        }),
    ),
  );
}
