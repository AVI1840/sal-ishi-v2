// עריכת קבוצת משקלות שסכומה 100%: שכבות ההתאמה, או מדדי דירוג הספקים.
// כל שורה מראה גם מאיזה נתון באטלס השכבה ניזונה.

import { useEffect, useState } from "react";
import { isProposal, statusNote, type Settings } from "@sal-ishi/core";
import { Alert, Badge, Button, ProposalBadge, TableWrap, useToast } from "@sal-ishi/ui";
import { useHq } from "../store";

export interface WeightItem {
  key: string;
  label: string;
  source: string;
}

export function WeightsCard(props: {
  id: string;
  title: string;
  description: string;
  settingKey: "matching_weights";
  statusKey: string;
  items: WeightItem[];
  defaults: Record<string, number>;
  settings: Settings;
}) {
  const { updateSetting } = useHq.getState();
  const toast = useToast();
  const current = (props.settings[props.settingKey] as Record<string, number> | undefined) ?? props.defaults;
  const toPct = (w: Record<string, number>) => Object.fromEntries(props.items.map((i) => [i.key, String(Math.round((w[i.key] ?? 0) * 100))]));
  const [draft, setDraft] = useState<Record<string, string>>(() => toPct(current));
  useEffect(() => setDraft(toPct(current)), [JSON.stringify(current)]); // eslint-disable-line react-hooks/exhaustive-deps

  const sum = props.items.reduce((n, i) => n + (Number(draft[i.key]) || 0), 0);
  const dirty = props.items.some((i) => Number(draft[i.key]) !== Math.round((current[i.key] ?? 0) * 100));
  const proposal = isProposal(props.settings, props.settingKey);

  const save = () => {
    const value = Object.fromEntries(props.items.map((i) => [i.key, (Number(draft[i.key]) || 0) / 100]));
    const err = updateSetting(props.settingKey, value);
    toast(err ? "error" : "success", err ?? `${props.title}: המשקלות עודכנו`);
  };

  return (
    <section className="card" aria-labelledby={props.id}>
      <div className="card__header">
        <h2 id={props.id}>{props.title}</h2>
        {proposal ? (
          <span className="row">
            <ProposalBadge note={statusNote(props.settings, props.settingKey)} />
            <Button small variant="ghost" onClick={() => updateSetting(props.statusKey, `סופי ${new Date().toLocaleDateString("he-IL")}`)}>סימון כסופי</Button>
          </span>
        ) : (
          <Badge tone="success">סופי</Badge>
        )}
      </div>
      <p className="muted">{props.description}</p>
      <TableWrap label={props.title}>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">רכיב</th>
              <th scope="col">משקל</th>
              <th scope="col">מאיפה הנתון</th>
            </tr>
          </thead>
          <tbody>
            {props.items.map((i) => (
              <tr key={i.key}>
                <th scope="row"><label htmlFor={`${props.id}-${i.key}`}>{i.label}</label></th>
                <td>
                  <span className="row" style={{ flexWrap: "nowrap" }}>
                    <input
                      id={`${props.id}-${i.key}`}
                      className="input input--narrow"
                      type="number"
                      min={0}
                      max={100}
                      inputMode="numeric"
                      value={draft[i.key] ?? ""}
                      onChange={(e) => setDraft({ ...draft, [i.key]: e.target.value })}
                    />
                    <span aria-hidden="true">%</span>
                  </span>
                </td>
                <td>{i.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <div className="row">
        <Badge tone={sum === 100 ? "success" : "warning"}>סכום: {sum}%</Badge>
        <Button small disabled={!dirty || sum !== 100} onClick={save}>שמירת המשקלות</Button>
      </div>
      {sum !== 100 ? <Alert tone="warning" live>סכום המשקלות חייב להיות 100%.</Alert> : null}
    </section>
  );
}
