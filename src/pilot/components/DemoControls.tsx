import type { Simulation } from "../model";
import { setSimulation, usePilot } from "../store";

const SWITCHES: { key: keyof Simulation; label: string }[] = [
  { key: "offline", label: "אין אינטרנט (הדמיה)" },
  { key: "walletEmpty", label: "הסל של החודש נגמר" },
  { key: "companionAway", label: "המלווה לא זמינה השבוע" },
  { key: "noServices", label: "אין שירותים בשכונה" },
];

/** מצבי קצה להדגמה. כל מתג משנה רק את התצוגה במכשיר הזה. */
export function DemoControls() {
  const { state } = usePilot();
  return (
    <fieldset className="p-switches" style={{ border: "1px solid #b5c7e2", borderRadius: 10, padding: "0.75em 1em" }}>
      <legend style={{ fontWeight: 600, padding: "0 0.4em" }}>מצבי קצה להדגמה</legend>
      {SWITCHES.map((s) => (
        <label key={s.key}>
          <input type="checkbox" checked={state.simulation[s.key]} onChange={(e) => setSimulation({ [s.key]: e.target.checked })} />
          {s.label}
        </label>
      ))}
      <p className="p-muted p-small">אשפוז ושירות שנדחה מדגימים מהמלווה: "אשפוז" בתיק של שרה, ו"לא לאשר" בבקשה שלה.</p>
    </fieldset>
  );
}
