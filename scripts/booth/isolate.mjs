// בידוד: איפוס מבקר בדוכן לא נוגע בנתוני כלי הפיילוט שנפתח באותו מקור.
import { boothUrl, launch } from "./common.mjs";

const b = await launch();
const page = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await page.goto(boothUrl + "#/"); await page.waitForTimeout(1500);
await page.evaluate(async () => {
  const f = document.createElement("iframe"); document.body.appendChild(f);
  f.contentWindow.localStorage.setItem("sal-ishi-field-v05:keep", "PILOT-DATA");
  f.contentWindow.localStorage.setItem("sal-ishi-pilot-v061-merge", "PILOT-STATE");
  await new Promise((res) => { const r = f.contentWindow.indexedDB.open("sal-ishi-field-v05", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => { const tx = r.result.transaction("kv", "readwrite"); tx.objectStore("kv").put("PILOT-IDB", "k"); tx.oncomplete = () => { r.result.close(); res(); }; }; });
});
await page.click("text=אני שרה"); await page.waitForTimeout(800);
const box = await page.locator("[data-booth-logo]").boundingBox();
await page.mouse.move(box.x + 20, box.y + 20); await page.mouse.down(); await page.waitForTimeout(3300); await page.mouse.up(); await page.waitForTimeout(1500);
const res = await page.evaluate(async () => {
  const f = document.querySelector("iframe");
  const ls = [f.contentWindow.localStorage.getItem("sal-ishi-field-v05:keep"), f.contentWindow.localStorage.getItem("sal-ishi-pilot-v061-merge")];
  const idb = await new Promise((res) => { const r = f.contentWindow.indexedDB.open("sal-ishi-field-v05", 1); r.onsuccess = () => { const g = r.result.transaction("kv").objectStore("kv").get("k"); g.onsuccess = () => { r.result.close(); res(g.result); }; }; r.onerror = () => res("ERR"); });
  const boothKeys = Object.keys(f.contentWindow.localStorage).filter((k) => k.startsWith("booth::")).length;
  return { ls, idb, boothKeys };
});
const pass = res.ls[0] === "PILOT-DATA" && res.ls[1] === "PILOT-STATE" && res.idb === "PILOT-IDB" && res.boothKeys > 0;
console.log("after booth reset, pilot data on the same origin:", JSON.stringify(res));
console.log("ISOLATION:", pass ? "PASS" : "FAIL");
await b.close();
process.exit(pass ? 0 : 1);
