// משוב שותפים בתוך הכלי: הערה לכל מסך, נשמרת בדפדפן ומיוצאת ל-Excel שהשותף
// שולח לצוות היישום. בלי שרת, בהתאם לקווים האדומים.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { MessageSquarePlus } from "lucide-react";
import { XLSX_MIME, openStore, writeWorkbook, type KeyValueStore } from "@sal-ishi/core";
import { Alert, Button, RadioGroup, TextArea, TextField } from "./controls";
import { Dialog, useToast } from "./feedback";
import { downloadBytes, todayStamp } from "./download";

export const FEEDBACK_KINDS = ["הערה כללית", "הצעה לשיפור", "משהו לא ברור", "תקלה", "לא תואם להכרעה"] as const;

export interface FeedbackNote {
  id: string;
  at: string;
  surface: string;
  screen: string;
  kind: (typeof FEEDBACK_KINDS)[number];
  text: string;
}

interface Ctx {
  notes: FeedbackNote[];
  add(note: Omit<FeedbackNote, "id" | "at" | "surface">): void;
  remove(id: string): void;
  clear(): void;
  reviewer: string;
  setReviewer(v: string): void;
  surface: string;
}

const FeedbackCtx = createContext<Ctx | null>(null);
const KEY = "notes";

export function FeedbackProvider(props: { surface: string; children: ReactNode }) {
  const [store, setStore] = useState<KeyValueStore | null>(null);
  const [notes, setNotes] = useState<FeedbackNote[]>([]);
  const [reviewer, setReviewerState] = useState("");

  useEffect(() => {
    // מאגר משותף לשני המשטחים באותו דפדפן, כך שמשוב משני המשטחים מיוצא יחד.
    void openStore("sal-ishi-feedback").then(async (s) => {
      setStore(s);
      setNotes((await s.get<FeedbackNote[]>(KEY)) ?? []);
      setReviewerState((await s.get<string>("reviewer")) ?? "");
    });
  }, []);

  const persist = useCallback(
    (next: FeedbackNote[]) => {
      setNotes(next);
      void store?.set(KEY, next);
    },
    [store],
  );

  const value: Ctx = {
    notes,
    surface: props.surface,
    reviewer,
    setReviewer(v) {
      setReviewerState(v);
      void store?.set("reviewer", v);
    },
    add(note) {
      persist([...notes, { ...note, id: globalThis.crypto.randomUUID(), at: new Date().toISOString(), surface: props.surface }]);
    },
    remove(id) {
      persist(notes.filter((n) => n.id !== id));
    },
    clear() {
      persist([]);
    },
  };

  return <FeedbackCtx.Provider value={value}>{props.children}</FeedbackCtx.Provider>;
}

export function useFeedback(): Ctx {
  const ctx = useContext(FeedbackCtx);
  if (!ctx) throw new Error("useFeedback מחוץ ל-FeedbackProvider");
  return ctx;
}

/** שם המסך הנוכחי, מתוך כותרת העמוד שה-PageHeader קובע. */
const currentScreen = () => document.title.split("|")[0]?.trim() || "מסך";

export function FeedbackButton() {
  const { add, notes } = useFeedback();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState("");
  const [kind, setKind] = useState<FeedbackNote["kind"]>("הערה כללית");
  const [text, setText] = useState("");
  const [touched, setTouched] = useState(false);

  const start = () => {
    setScreen(currentScreen());
    setKind("הערה כללית");
    setText("");
    setTouched(false);
    setOpen(true);
  };

  const save = () => {
    setTouched(true);
    if (!text.trim()) return;
    add({ screen, kind, text: text.trim() });
    toast("success", `ההערה נשמרה (${notes.length + 1} הערות). אפשר לייצא אותן במסך "המשוב שלי".`);
    setOpen(false);
  };

  return (
    <>
      <Button variant="secondary" small icon={<MessageSquarePlus size={16} />} onClick={start} className="feedback-btn">
        הוספת משוב
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`משוב על המסך: ${screen}`}
        width={620}
        footer={
          <>
            <Button onClick={save}>שמירת ההערה</Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>ביטול</Button>
          </>
        }
      >
        <RadioGroup legend="סוג ההערה" value={kind} onChange={(v) => setKind(v as FeedbackNote["kind"])}
          options={FEEDBACK_KINDS.map((k) => ({ value: k, label: k }))} />
        <TextArea label="ההערה" required value={text} onChange={(e) => setText(e.target.value)}
          error={touched && !text.trim() ? "כתבו את ההערה" : null}
          hint="מה ראיתם, מה ציפיתם לראות, ומה הייתם משנים. אין לכתוב פרטים מזהים של תושבים." rows={5} />
      </Dialog>
    </>
  );
}

/** מסך "המשוב שלי": רשימת ההערות, פרטי הסוקר וייצוא ל-Excel. */
export function FeedbackScreen(props: { sendTo?: string }) {
  const { notes, remove, clear, reviewer, setReviewer } = useFeedback();
  const toast = useToast();

  const exportExcel = () => {
    const rows = notes.map((n) => ({
      תאריך: new Date(n.at).toLocaleString("he-IL"),
      משטח: n.surface,
      מסך: n.screen,
      "סוג ההערה": n.kind,
      הערה: n.text,
      "שם וארגון הסוקר": reviewer,
    }));
    downloadBytes(`משוב_אטלס_${todayStamp()}.xlsx`, writeWorkbook([{ name: "משוב", rows, headers: ["תאריך", "משטח", "מסך", "סוג ההערה", "הערה", "שם וארגון הסוקר"] }]), XLSX_MIME);
    toast("success", "קובץ המשוב ירד למחשב");
  };

  return (
    <section className="stack" aria-labelledby="fb-h">
      <h1 id="fb-h">המשוב שלי</h1>
      <p className="page-header__desc">
        ההערות נשמרות רק בדפדפן הזה. בסיום, הורידו את קובץ ה-Excel ושלחו אותו
        {props.sendTo ? <> אל <a href={`mailto:${props.sendTo}?subject=${encodeURIComponent("משוב על אטלס וקטלוג סל אישי")}`}>{props.sendTo}</a></> : " לצוות היישום"}.
      </p>
      <div className="card">
        <TextField label="שם וארגון (לא חובה)" value={reviewer} onChange={(e) => setReviewer(e.target.value)}
          hint="כדי שנוכל לחזור אליכם עם שאלות. יופיע בקובץ המשוב." />
        <div className="row">
          <Button disabled={!notes.length} onClick={exportExcel}>הורדת המשוב ל-Excel ({notes.length})</Button>
          {notes.length ? <Button variant="ghost" onClick={() => { clear(); toast("success", "ההערות נמחקו"); }}>מחיקת כל ההערות</Button> : null}
        </div>
      </div>
      {notes.length ? (
        <ul className="stack plain-list">
          {notes.map((n) => (
            <li key={n.id} className="card">
              <div className="card__header">
                <strong>{n.surface}: {n.screen}</strong>
                <span className="muted">{n.kind} | {new Date(n.at).toLocaleString("he-IL")}</span>
              </div>
              <p>{n.text}</p>
              <div>
                <Button small variant="ghost" onClick={() => remove(n.id)} aria-label={`מחיקת ההערה על ${n.screen}`}>מחיקה</Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Alert tone="info">עוד אין הערות. בכל מסך יש כפתור "הוספת משוב" בראש העמוד.</Alert>
      )}
    </section>
  );
}
