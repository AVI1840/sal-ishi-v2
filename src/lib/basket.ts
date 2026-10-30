/**
 * הסל לאזרח בחודש (מפגש 2): ₪760. רק הארנק האישי (500) הוא נקודות שהאזרח בוחר
 * איתן. ליווי, קהילה ותפעול הם שקלים. מקור אחד לכל המסכים.
 */
import { catalogState } from "@/data/catalogSource";
import { amount } from "./wallet";

type BasketKeys = "total" | "personal_wallet" | "companion" | "community" | "overhead";

export function basket(): Record<BasketKeys, number> {
  return catalogState.seed.settings as unknown as Record<BasketKeys, number>;
}

/** שורות הפירוט: תווית וסכום מוצג. */
export function basketLines(): { label: string; value: string }[] {
  const b = basket();
  return [
    { label: "ארנק אישי: האזרח בוחר בשוק", value: amount(b.personal_wallet) },
    { label: "ליווי: המלווה החברתית", value: `₪${b.companion}` },
    { label: "קהילה: פעילות שהמלווה יוזמת", value: `₪${b.community}` },
    { label: "תפעול", value: `₪${b.overhead}` },
  ];
}

/** "₪760 לאזרח בחודש: 500 נקודות בארנק, ₪181 ליווי, ₪20 קהילה, ₪59 תפעול". */
export function basketSentence(): string {
  const b = basket();
  return `₪${b.total} לאזרח בחודש: ${amount(b.personal_wallet)} בארנק, ₪${b.companion} ליווי, ₪${b.community} קהילה, ₪${b.overhead} תפעול`;
}
