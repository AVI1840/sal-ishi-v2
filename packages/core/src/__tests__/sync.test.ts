import { describe, expect, it } from "vitest";
import { buildCatalogExport, buildCitizenCatalog } from "../catalogExport";
import { buildPilotPackage } from "../pilotPackage";
import { defaultSeed as seed } from "../seed";
import { FileSyncAdapter, citizenCatalogPath } from "../sync/FileSyncAdapter";
import { createMemoryFileIO } from "../sync/fileIO";
import type { SyncAdapter } from "../sync/SyncAdapter";
import { AUTH, demoAuthority, nGeneral } from "./fixtures";

const NOW = new Date("2026-11-20T08:00:00Z");

function setup() {
  const io = createMemoryFileIO();
  const adapter: SyncAdapter = new FileSyncAdapter(io);
  return { io, adapter };
}

describe("FileSyncAdapter", () => {
  it("שטח שולח חבילה, מטה מקבל אותה בלי איבוד נתונים", async () => {
    const field = setup();
    const pkg = await buildPilotPackage(demoAuthority(), seed, NOW);
    await field.adapter.sendPilotPackage(pkg);
    const [name, text] = [...field.io.saved][0]!;
    expect(name).toMatch(/^pilot_package_.+_2026-11-20_[0-9a-f]{8}\.json$/);

    const hq = setup();
    hq.io.toPick = [{ name: name!, text: text! }];
    const [received] = await hq.adapter.receivePilotPackages();
    expect(received).toEqual({ ok: true, fileName: name, pkg });
  });

  it("קובץ פגום מוחזר כשגיאה ולא מפיל את השאר", async () => {
    const { io, adapter } = setup();
    const pkg = await buildPilotPackage(demoAuthority(), seed, NOW);
    io.toPick = [
      { name: "bad.json", text: "{not json" },
      { name: "tampered.json", text: JSON.stringify({ ...pkg, authority: "אחרת" }) },
      { name: "good.json", text: JSON.stringify(pkg) },
    ];
    const results = await adapter.receivePilotPackages();
    expect(results.map((r) => r.ok)).toEqual([false, false, true]);
    expect(results[0]).toMatchObject({ error: "הקובץ אינו JSON תקין" });
  });

  it("קטלוג לאזרח: פרסום וטעינה לפי שכונה", async () => {
    const { io, adapter } = setup();
    const { catalog } = buildCitizenCatalog(demoAuthority(), nGeneral.id, seed, NOW);
    await adapter.publishCitizenCatalog(catalog);
    expect(io.saved.size).toBe(1);

    io.published.set(citizenCatalogPath(AUTH, nGeneral.id), [...io.saved.values()][0]!);
    expect(await adapter.loadCitizenCatalog(AUTH, nGeneral.id)).toEqual(catalog);
    expect(await adapter.loadCitizenCatalog(AUTH, "לא-קיים")).toBeNull();
  });

  it("ייצוא לאינטגרטור נשמר כקובץ", async () => {
    const { io, adapter } = setup();
    const { export: exp } = await buildCatalogExport(demoAuthority(), seed, NOW);
    await adapter.sendIntegratorExport(exp);
    expect([...io.saved.keys()]).toEqual(["catalog_export_v1.0_2026-11-20.json"]);
  });

  it("הפצת seed מהמטה וקבלתו בשטח", async () => {
    const hq = setup();
    await hq.adapter.publishSeed(seed);
    const [name, text] = [...hq.io.saved][0]!;
    const field = setup();
    field.io.toPick = [{ name: name!, text: text! }];
    const received = await field.adapter.receiveSeed();
    expect(received?.meta.version).toBe("0.3");
    expect(received?.service_types).toHaveLength(57);
  });
});
