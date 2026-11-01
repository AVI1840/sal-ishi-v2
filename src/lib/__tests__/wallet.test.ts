import { afterEach, describe, expect, it } from "vitest";
import { appSettings } from "@/pilot/settings";
import { amount, unitNote } from "../wallet";

describe("יחידת הארנק מההגדרות", () => {
  const original = appSettings.wallet;
  afterEach(() => {
    appSettings.wallet = original;
  });

  it("ברירת המחדל: נקודות, עם הסבר שנקודה = ₪1", () => {
    expect(amount(500)).toBe("500 נקודות");
    expect(amount(1)).toBe("נקודה אחת");
    expect(unitNote()).toBe("נקודה = ₪1");
  });

  it("אם הפורום מחליט על שוברים בפיילוט: התצוגה מתהפכת לשקלים בלי קוד", () => {
    appSettings.wallet = { unit: "shekel", simulated: true };
    expect(amount(500)).toBe("₪500");
    expect(unitNote()).toBeNull();
  });
});
