/**
 * דירוג ספק: הגדרה אחת לכל המסכים, מהליבה (SUPPLIER_RATING_COMPONENTS). מתג אחד
 * ב-seed (supplier_rating_enabled), המשקלות ייקבעו, ומתחת למינימום הערכות: "ספק חדש".
 */
import { SUPPLIER_RATING_COMPONENTS as CORE } from "@sal-ishi/core/citizen";

export const SUPPLIER_RATING_COMPONENTS = CORE.map((c) => c.label);

export const SUPPLIER_RATING_NOTE = `דירוג הספק משקלל: ${SUPPLIER_RATING_COMPONENTS.join(", ")}. ההרכב והמשקלות ייקבעו בהמשך.`;

/** לאזרח: אותו דבר, במילים שלו. */
export const SUPPLIER_RATING_NOTE_CITIZEN = "דירוג הספק בנוי מהתאמה לאנשים כמוך, ממה שמשתתפים אומרים, מדירוג המלווה, מעמידה בהתחייבויות ומהתוצאות.";
