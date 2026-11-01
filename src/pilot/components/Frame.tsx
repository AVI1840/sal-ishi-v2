import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Info, WifiOff, XCircle } from "lucide-react";
import { appSettings, isDemo } from "../settings";
import { usePilot } from "../store";
import { resetDemo } from "../reset";

/** חיבור לרשת: האמיתי, או מנותק בהדמיה של ההדגמה. */
export function useOnline(): boolean {
  const { state } = usePilot();
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online && !state.simulation.offline;
}

export const OPEN_FEEDBACK = "sal-ishi:open-feedback";

/** פס ההדגמה: מופיע רק ב-mode: demo. */
export function DemoBar() {
  const navigate = useNavigate();
  if (!isDemo()) return null;
  return (
    <aside className="p-demo-bar" aria-label="מצב הדגמה" data-no-read>
      <span>
        <strong>הדגמה</strong>: {appSettings.demo.data_label}. גרסה {appSettings.version}.
      </span>
      <span className="p-row">
        <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_FEEDBACK))}>
          משוב
        </button>
        <Link to="/">החלפת דמות</Link>
        <button
          type="button"
          onClick={async () => {
            await resetDemo();
            navigate("/");
          }}
        >
          איפוס ההדגמה
        </button>
      </span>
    </aside>
  );
}

const ALERT_ICON = { info: Info, success: CheckCircle2, warning: AlertTriangle, error: XCircle };

export function Alert(props: { tone: keyof typeof ALERT_ICON; children: ReactNode; live?: boolean }) {
  const Icon = ALERT_ICON[props.tone];
  return (
    <div className={`p-alert p-alert--${props.tone}`} role={props.live ? (props.tone === "error" ? "alert" : "status") : undefined}>
      <Icon aria-hidden="true" size={22} style={{ flex: "none", marginTop: 2 }} />
      <div className="p-stack" style={{ gap: "0.35em" }}>{props.children}</div>
    </div>
  );
}

export function OfflineBanner(props: { text: string }) {
  return (
    <div className="p-banner p-banner--offline" role="status">
      <WifiOff aria-hidden="true" size={22} style={{ flex: "none" }} />
      <p>{props.text}</p>
    </div>
  );
}

/** קובע את כותרת הלשונית לכל מסך, לקורא המסך ולמשתמש. */
export function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | הסל האישי`;
  }, [title]);
}
