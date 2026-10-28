// דיאלוג, הודעות קופצות, מצב ריק וטבלה נגללת.

import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Alert, Button } from "./controls";

/**
 * דיאלוג על בסיס <dialog> עם showModal: מלכודת פוקוס ו-Escape מובנים בדפדפן.
 * בסגירה הפוקוס חוזר לאלמנט שפתח אותו.
 */
export function Dialog(props: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (props.open && !dialog.open) {
      opener.current = document.activeElement;
      dialog.showModal();
    } else if (!props.open && dialog.open) {
      dialog.close();
    }
  }, [props.open]);

  // opener נשאר מוגדר רק כל עוד הדיאלוג פתוח. דיאלוג שמוסר מהעמוד כשהוא
  // עדיין פתוח מחזיר את הפוקוס למי שפתח אותו.
  const restoreFocus = () => {
    const el = opener.current;
    opener.current = null;
    if (el instanceof HTMLElement && el.isConnected) el.focus();
  };
  useEffect(() => () => restoreFocus(), []);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onClose = () => {
      props.onClose();
      restoreFocus();
    };
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [props.onClose]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      aria-modal="true"
      style={props.width ? { width: `min(${props.width}px, calc(100vw - 32px))` } : undefined}
    >
      {props.open ? (
        <>
          <div className="dialog__header">
            <h2 id={titleId}>{props.title}</h2>
            <Button variant="ghost" aria-label="סגירה" onClick={() => ref.current?.close()} icon={<X size={20} />} />
          </div>
          <div className="dialog__body">{props.children}</div>
          {props.footer ? <div className="dialog__footer">{props.footer}</div> : null}
        </>
      ) : null}
    </dialog>
  );
}

type ToastTone = "success" | "error" | "info" | "warning";
interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

const ToastContext = createContext<(tone: ToastTone, message: string) => void>(() => {});

export function ToastProvider(props: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);
  const push = useCallback((tone: ToastTone, message: string) => {
    const id = next.current++;
    setItems((list) => [...list, { id, tone, message }]);
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), tone === "error" ? 9000 : 5000);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {props.children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="toast">
            <Alert tone={t.tone} live={t.tone === "error"}>{t.message}</Alert>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

export function EmptyState(props: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card empty">
      {props.icon ? <span aria-hidden="true">{props.icon}</span> : null}
      <h2>{props.title}</h2>
      {props.children ? <p>{props.children}</p> : null}
      {props.action}
    </div>
  );
}

/** עוטף טבלה כך שאפשר לגלול אותה במקלדת כשהיא רחבה מהמסך. */
export function TableWrap(props: { label: string; children: ReactNode }) {
  return (
    <div className="table-wrap" role="region" aria-label={props.label} tabIndex={0}>
      {props.children}
    </div>
  );
}
