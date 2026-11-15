import { describe, expect, it } from "vitest";
import { createMemoryStore, openVersionedStore, type KeyValueStore } from "../storage";

function stores() {
  const map = new Map<string, KeyValueStore>();
  const open = async (ns: string) => {
    if (!map.has(ns)) map.set(ns, createMemoryStore());
    return map.get(ns)!;
  };
  return { map, open };
}

describe("אחסון לפי גרסה: 0.5 קורא את 0.4 ולא כותב עליו", () => {
  it("בפתיחה הראשונה מעתיק מ-0.4, ו-0.4 נשאר כמו שהיה", async () => {
    const { open } = stores();
    const legacy = await open("sal-ishi-hq");
    await legacy.set("hq-state", { v: "0.4", services: 3 });
    const { store, imported } = await openVersionedStore("sal-ishi-hq", ["hq-state"], open);
    expect(imported).toEqual(["hq-state"]);
    expect(await store.get("hq-state")).toEqual({ v: "0.4", services: 3 });
    await store.set("hq-state", { v: "0.5" });
    expect(await legacy.get("hq-state")).toEqual({ v: "0.4", services: 3 });
  });

  it("לא מייבא שוב אחרי הפעם הראשונה (גם לא אחרי איפוס)", async () => {
    const { open } = stores();
    await (await open("sal-ishi-field")).set("field-state", { a: 1 });
    await openVersionedStore("sal-ishi-field", ["field-state"], open);
    const v5 = await open("sal-ishi-field-v05");
    await v5.delete("field-state");
    const again = await openVersionedStore("sal-ishi-field", ["field-state"], open);
    expect(again.imported).toEqual([]);
    expect(await again.store.get("field-state")).toBeUndefined();
  });

  it("בלי נתוני 0.4: אין ייבוא ואין שגיאה", async () => {
    const { open } = stores();
    const { imported } = await openVersionedStore("sal-ishi-hq", ["hq-state"], open);
    expect(imported).toEqual([]);
  });
});
