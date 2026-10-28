// מימוש SyncAdapter מבוסס קבצים. הקריאה והכתיבה עצמן עוברות דרך FileIO,
// כך שבדפדפן זו הורדה ובחירת קובץ, ובבדיקות זה זיכרון.

import { citizenCatalogSchema, type CatalogExport, type CitizenCatalog, type PilotPackage } from "../model";
import { parsePilotPackage } from "../pilotPackage";
import { parseSeed, type Seed } from "../seed";
import type { ReceivedPackage, SyncAdapter } from "./SyncAdapter";

export interface PickedFile {
  name: string;
  text: string;
}

export interface FileIO {
  /** שמירת קובץ אצל המשתמשת (בדפדפן: הורדה). */
  save(fileName: string, text: string, mimeType: string): Promise<void>;
  /** בחירת קבצים על ידי המשתמשת. */
  pick(accept: string, multiple: boolean): Promise<PickedFile[]>;
  /** קריאת קובץ שפורסם (בדפדפן: fetch יחסי לאתר). null אם לא קיים. */
  fetchText(path: string): Promise<string | null>;
}

const JSON_MIME = "application/json";

export function citizenCatalogPath(authority: string, neighborhoodId: string, basePath = "catalog"): string {
  return `${basePath}/${encodeURIComponent(authority)}/${encodeURIComponent(neighborhoodId)}.json`;
}

function stamp(iso: string): string {
  return iso.slice(0, 10);
}

export class FileSyncAdapter implements SyncAdapter {
  constructor(
    private readonly io: FileIO,
    private readonly options: { catalogBasePath?: string } = {},
  ) {}

  async sendPilotPackage(pkg: PilotPackage): Promise<void> {
    const name = `pilot_package_${pkg.authority}_${stamp(pkg.exportedAt)}_${pkg.contentHash.slice(0, 8)}.json`;
    await this.io.save(name, JSON.stringify(pkg, null, 2), JSON_MIME);
  }

  async receivePilotPackages(): Promise<ReceivedPackage[]> {
    const files = await this.io.pick(".json,application/json", true);
    const results: ReceivedPackage[] = [];
    for (const f of files) {
      try {
        results.push({ ok: true, fileName: f.name, pkg: await parsePilotPackage(f.text) });
      } catch (e) {
        results.push({ ok: false, fileName: f.name, error: e instanceof Error ? e.message : String(e) });
      }
    }
    return results;
  }

  async publishCitizenCatalog(catalog: CitizenCatalog): Promise<void> {
    // בשלב א' המטה מוריד את הקובץ ומעלה אותו לתיקיית public/catalog של הכלי לאזרח.
    const name = `catalog_${catalog.authority}_${catalog.neighborhood.id}.json`;
    await this.io.save(name, JSON.stringify(citizenCatalogSchema.parse(catalog), null, 2), JSON_MIME);
  }

  async loadCitizenCatalog(authority: string, neighborhoodId: string): Promise<CitizenCatalog | null> {
    const text = await this.io.fetchText(citizenCatalogPath(authority, neighborhoodId, this.options.catalogBasePath));
    if (text === null) return null;
    return citizenCatalogSchema.parse(JSON.parse(text));
  }

  async publishSeed(seed: Seed): Promise<void> {
    await this.io.save(`seed_data_catalog_v${seed.meta.version}.json`, JSON.stringify(seed, null, 1), JSON_MIME);
  }

  async receiveSeed(): Promise<Seed | null> {
    const [file] = await this.io.pick(".json,application/json", false);
    return file ? parseSeed(JSON.parse(file.text)) : null;
  }

  async sendIntegratorExport(exp: CatalogExport): Promise<void> {
    await this.io.save(`catalog_export_v${exp.version}_${stamp(exp.generatedAt)}.json`, JSON.stringify(exp, null, 2), JSON_MIME);
  }
}
