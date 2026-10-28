// הממשק היחיד לתנועת נתונים בין המשטחים. בשלב א' המימוש הוא קבצים
// (FileSyncAdapter). בשלב ב' יבוא מימוש API עם אותו ממשק, בלי לשנות את שאר הקוד.

import type { CatalogExport, CitizenCatalog, CitizenCatalogIndex, PilotPackage, UnmetDemandFile } from "../model";
import type { Seed } from "../seed";

export interface SyncAdapter {
  /** שטח למטה: שליחת חבילת פיילוט. */
  sendPilotPackage(pkg: PilotPackage): Promise<void>;
  /** מטה: קבלת חבילות פיילוט. כל חבילה נבדקת (סכמה וחתימת תוכן) לפני שהיא מוחזרת. */
  receivePilotPackages(): Promise<ReceivedPackage[]>;

  /** מטה לאזרח: פרסום הקטלוג המאושר של שכונה. */
  publishCitizenCatalog(catalog: CitizenCatalog): Promise<void>;
  /** אזרח: טעינת הקטלוג המאושר של שכונה, או null אם עוד לא פורסם. */
  loadCitizenCatalog(authority: string, neighborhoodId: string): Promise<CitizenCatalog | null>;
  /** מטה לאזרח: אינדקס הקטלוגים שפורסמו. */
  publishCitizenCatalogIndex(index: CitizenCatalogIndex): Promise<void>;
  /** אזרח: אילו קטלוגים פורסמו, או null אם אין אינדקס. */
  loadCitizenCatalogIndex(): Promise<CitizenCatalogIndex | null>;

  /** מלווה לשטח: ביקוש שלא נענה, מצטבר לפי שכונה וסוג שירות. */
  sendUnmetDemand(file: UnmetDemandFile): Promise<void>;
  /** שטח: קבלת קובץ ביקוש שלא נענה. */
  receiveUnmetDemand(): Promise<UnmetDemandFile | null>;

  /** מטה לשטח: הפצת גרסת seed. */
  publishSeed(seed: Seed): Promise<void>;
  /** שטח: קבלת גרסת seed מהמטה. */
  receiveSeed(): Promise<Seed | null>;

  /** מטה לאינטגרטור: catalog_export. */
  sendIntegratorExport(exp: CatalogExport): Promise<void>;
}

/** תוצאה של קבלת קובץ: חבילה תקינה, או שגיאה עם שם הקובץ. */
export type ReceivedPackage =
  | { ok: true; fileName: string; pkg: PilotPackage }
  | { ok: false; fileName: string; error: string };
