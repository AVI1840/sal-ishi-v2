// ייבוא Excel בשלושה צעדים: בחירת קובץ (עמודה מזהה חוסמת אותו), מיפוי עמודות ותצוגה מקדימה.

import { useEffect, useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import {
  XLSX_MIME,
  autoMapColumns,
  missingRequiredMappings,
  readFirstSheet,
  type ColumnMapping,
  type ImportField,
  type Row,
  type RowError,
} from "@sal-ishi/core";
import { Alert, Button, Dialog, SelectField, TableWrap, downloadBytes, pickFile, todayStamp } from "@sal-ishi/ui";

interface Loaded {
  fileName: string;
  headers: string[];
  rows: Row[];
}

export function ImportDialog<K extends string>(props: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  fields: readonly ImportField<K>[];
  template: () => Uint8Array;
  templateName: string;
  onImport: (rows: Row[], mapping: ColumnMapping<K>) => { imported: number; errors: RowError[] };
}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping<K>>({});
  const [result, setResult] = useState<{ imported: number; errors: RowError[] } | null>(null);

  useEffect(() => {
    if (props.open) {
      setLoaded(null);
      setBlocked(null);
      setResult(null);
      setMapping({});
    }
  }, [props.open]);

  const choose = async () => {
    const file = await pickFile(".xlsx,.xls,.csv");
    if (!file) return;
    setResult(null);
    try {
      const r = readFirstSheet(new Uint8Array(await file.arrayBuffer()));
      if (!r.ok) {
        setLoaded(null);
        setBlocked(r.message);
        return;
      }
      setBlocked(null);
      setLoaded({ fileName: file.name, headers: r.headers, rows: r.rows });
      setMapping(autoMapColumns(r.headers, [...props.fields]));
    } catch {
      setLoaded(null);
      setBlocked("לא הצלחנו לקרוא את הקובץ. ודאו שזה קובץ Excel או CSV תקין.");
    }
  };

  const missing = missingRequiredMappings([...props.fields], mapping);
  const mappedFields = props.fields.filter((f) => mapping[f.key]);

  const doImport = () => {
    if (!loaded || missing.length) return;
    setResult(props.onImport(loaded.rows, mapping));
  };

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title={props.title}
      width={960}
      footer={
        <>
          {loaded && !result ? (
            <Button onClick={doImport} disabled={missing.length > 0} icon={<Upload size={18} />}>
              ייבוא {loaded.rows.length} שורות
            </Button>
          ) : null}
          <Button variant="secondary" onClick={props.onClose}>{result ? "סגירה" : "ביטול"}</Button>
        </>
      }
    >
      <p>{props.description}</p>
      <Alert tone="info" title="רק נתונים מצטברים">
        קובץ עם עמודה שנראית מזהה (ת"ז, שם, טלפון, נייד, כתובת) ייחסם. אל תכניסו פרטים של תושבים.
      </Alert>
      <div className="row">
        <Button variant="secondary" onClick={choose} icon={<FileSpreadsheet size={18} />}>
          {loaded ? "בחירת קובץ אחר" : "בחירת קובץ"}
        </Button>
        <Button variant="ghost" onClick={() => downloadBytes(`${props.templateName}_${todayStamp()}.xlsx`, props.template(), XLSX_MIME)}>
          הורדת תבנית ריקה
        </Button>
        {loaded ? <span className="muted">{loaded.fileName}: {loaded.rows.length} שורות</span> : null}
      </div>

      {blocked ? <Alert tone="error" title="הקובץ לא נקלט" live>{blocked}</Alert> : null}

      {loaded && !result ? (
        <>
          <h3>מיפוי עמודות</h3>
          <div className="grid grid--form">
            {props.fields.map((f) => (
              <SelectField
                key={f.key}
                label={f.label}
                required={f.required}
                value={mapping[f.key] ?? ""}
                onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value || undefined }))}
                placeholder="לא לייבא"
                options={loaded.headers.map((h) => ({ value: h, label: h }))}
              />
            ))}
          </div>
          {missing.length ? (
            <Alert tone="warning" live>חסר מיפוי לשדות חובה: {missing.map((f) => f.label).join(", ")}</Alert>
          ) : null}
          <h3>תצוגה מקדימה</h3>
          <TableWrap label="תצוגה מקדימה של חמש השורות הראשונות">
            <table className="table">
              <thead>
                <tr>
                  {mappedFields.map((f) => <th key={f.key} scope="col">{f.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {loaded.rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {mappedFields.map((f) => <td key={f.key}>{String(row[mapping[f.key]!] ?? "")}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </>
      ) : null}

      {result ? (
        <div className="stack" role="status">
          <Alert tone={result.errors.length ? "warning" : "success"} title={`נקלטו ${result.imported} שורות`}>
            {result.errors.length ? `${result.errors.length} שורות לא נקלטו:` : "כל השורות נקלטו."}
          </Alert>
          {result.errors.length ? (
            <ul>
              {result.errors.slice(0, 20).map((e) => <li key={e.row}>שורה {e.row}: {e.message}</li>)}
            </ul>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}
