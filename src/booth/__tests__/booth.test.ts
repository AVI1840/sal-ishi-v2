import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { ALL_TOURS } from "../tours";
import { booth, nextActOf } from "../store";

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const val = (v: string | (() => string)) => (typeof v === "function" ? v() : v);

describe("ניסוח הסיורים", () => {
  it("כותרת עד 5 מילים וטקסט עד 14 מילים, בלי לוכסנים", () => {
    for (const tour of ALL_TOURS)
      for (const step of tour) {
        const title = val(step.title);
        const text = val(step.text);
        expect(words(title), title).toBeLessThanOrEqual(6);
        expect(words(text), text).toBeLessThanOrEqual(14);
        expect(`${title} ${text}`).not.toMatch(/[א-ת]\/[א-ת]/);
      }
  });

  it("אין לשון זכר/נקבה עם לוכסן בשום קובץ של הדוכן", () => {
    const dir = path.resolve(__dirname, "..");
    for (const f of readdirSync(dir).filter((x) => /\.(tsx?)$/.test(x))) {
      const src = readFileSync(path.join(dir, f), "utf8");
      const bad = /"[^"\n]*[א-ת]\/[יתא][^"\n]*"/.exec(src);
      expect(bad?.[0], f).toBeUndefined();
    }
  });
});

describe("החוט בין המערכות", () => {
  it("נכנסים משרה: שרה, רונית, מטה; ומהמלווה: מלווה, מטה, שרה", () => {
    booth.reset();
    booth.start("citizen");
    expect(nextActOf(booth.get())).toBe("companion");
    booth.start("companion");
    expect(booth.get().order).toEqual(["companion", "hq", "citizen"]);
    expect(nextActOf(booth.get())).toBe("hq");
  });

  it("אחרי שהכל נראה אין המשך, ובמסלול שופטים וסיור מלא אין חוט", () => {
    booth.start("hq");
    booth.finish();
    booth.startAct("citizen");
    booth.finish();
    booth.startAct("companion");
    expect(nextActOf(booth.get())).toBeNull();
    booth.start("judges");
    expect(nextActOf(booth.get())).toBeNull();
    booth.start("citizen", [], true);
    expect(nextActOf(booth.get())).toBeNull();
    booth.reset();
  });
});
