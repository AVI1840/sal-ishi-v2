// כפתורים, תגיות סטטוס ושדות טופס. כל שדה עם תווית, רמז ושגיאה מקושרים.

import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AlertTriangle, CheckCircle2, Info, Lightbulb, MinusCircle, XCircle } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; small?: boolean; icon?: ReactNode }
>(function Button({ variant = "primary", small, icon, className, children, type = "button", ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={["btn", `btn--${variant}`, small ? "btn--small" : "", className ?? ""].join(" ").trim()}
      {...rest}
    >
      {icon ? <span aria-hidden="true" style={{ display: "inline-flex" }}>{icon}</span> : null}
      {children}
    </button>
  );
});

export type Tone = "success" | "warning" | "error" | "info" | "neutral" | "proposal";

const TONE_ICON: Record<Tone, ReactNode> = {
  success: <CheckCircle2 size={16} />,
  warning: <AlertTriangle size={16} />,
  error: <XCircle size={16} />,
  info: <Info size={16} />,
  neutral: <MinusCircle size={16} />,
  proposal: <Lightbulb size={16} />,
};

/** תגית סטטוס: תמיד טקסט וסמל, לא רק צבע. */
export function Badge(props: { tone: Tone; children: ReactNode; title?: string }) {
  return (
    <span className={`badge badge--${props.tone}`} title={props.title}>
      <span aria-hidden="true" style={{ display: "inline-flex" }}>{TONE_ICON[props.tone]}</span>
      {props.children}
    </span>
  );
}

/** סימון "הצעה" לערך שממתין להכרעה (לפי *_status ב-seed). */
export function ProposalBadge(props: { note?: string }) {
  return (
    <Badge tone="proposal" title={props.note}>
      הצעה{props.note ? <span className="visually-hidden">: {props.note}</span> : null}
    </Badge>
  );
}

export function Alert(props: {
  tone: Exclude<Tone, "neutral" | "proposal">;
  title?: ReactNode;
  children?: ReactNode;
  live?: boolean;
}) {
  return (
    <div className={`alert alert--${props.tone}`} role={props.live ? (props.tone === "error" ? "alert" : "status") : undefined}>
      <span aria-hidden="true" style={{ display: "inline-flex", marginTop: 2 }}>{TONE_ICON[props.tone]}</span>
      <div className="alert__body">
        {props.title ? <span className="alert__title">{props.title}</span> : null}
        {props.children}
      </div>
    </div>
  );
}

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  extra?: ReactNode;
}

function FieldFrame(props: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={props.id}>
        {props.label}
        {props.required ? <span className="field__required" aria-hidden="true">*</span> : null}
        {props.extra ? <> {props.extra}</> : null}
      </label>
      {props.children}
      {props.hint ? <span id={`${props.id}-hint`} className="field__hint">{props.hint}</span> : null}
      {props.error ? (
        <span id={`${props.id}-err`} className="field__error" role="alert">{props.error}</span>
      ) : null}
    </div>
  );
}

function describedBy(id: string, p: FieldProps) {
  return [p.hint ? `${id}-hint` : "", p.error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
}

export function TextField(props: FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, "id">) {
  const { label, hint, error, required, extra, ...input } = props;
  const id = useId();
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} required={required} extra={extra}>
      <input
        id={id}
        className="input"
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, props)}
        {...input}
      />
    </FieldFrame>
  );
}

export function TextArea(props: FieldProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">) {
  const { label, hint, error, required, extra, ...input } = props;
  const id = useId();
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} required={required} extra={extra}>
      <textarea
        id={id}
        className="textarea"
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, props)}
        {...input}
      />
    </FieldFrame>
  );
}

export interface Option {
  value: string;
  label: string;
}

export function SelectField(
  props: FieldProps & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & { options: Option[]; placeholder?: string },
) {
  const { label, hint, error, required, extra, options, placeholder, ...select } = props;
  const id = useId();
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} required={required} extra={extra}>
      <select
        id={id}
        className="select"
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, props)}
        {...select}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FieldFrame>
  );
}

export function CheckboxGroup(props: {
  legend: ReactNode;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  hint?: ReactNode;
  required?: boolean;
  error?: string | null;
}) {
  const id = useId();
  return (
    <fieldset
      className="fieldset"
      aria-describedby={[props.hint ? `${id}-hint` : "", props.error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined}
    >
      <legend className="fieldset__legend">
        {props.legend}
        {props.required ? <span className="field__required" aria-hidden="true">*</span> : null}
        {props.required ? <span className="visually-hidden"> (שדה חובה)</span> : null}
      </legend>
      <div className="choices">
        {props.options.map((o) => (
          <label key={o.value} className="choice">
            <input
              type="checkbox"
              checked={props.value.includes(o.value)}
              onChange={(e) =>
                props.onChange(e.target.checked ? [...props.value, o.value] : props.value.filter((v) => v !== o.value))
              }
            />
            {o.label}
          </label>
        ))}
      </div>
      {props.hint ? <span id={`${id}-hint`} className="field__hint">{props.hint}</span> : null}
      {props.error ? <span id={`${id}-err`} className="field__error" role="alert">{props.error}</span> : null}
    </fieldset>
  );
}

export function RadioGroup(props: {
  legend: ReactNode;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  name?: string;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <fieldset className="fieldset" aria-describedby={props.hint ? `${id}-hint` : undefined}>
      <legend className="fieldset__legend">{props.legend}</legend>
      <div className="choices">
        {props.options.map((o) => (
          <label key={o.value} className="choice">
            <input
              type="radio"
              name={props.name ?? id}
              value={o.value}
              checked={props.value === o.value}
              onChange={() => props.onChange(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
      {props.hint ? <span id={`${id}-hint`} className="field__hint">{props.hint}</span> : null}
    </fieldset>
  );
}

export function CheckboxField(props: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; hint?: ReactNode }) {
  const id = useId();
  return (
    <div className="field">
      <label className="choice" htmlFor={id}>
        <input id={id} type="checkbox" checked={props.checked} onChange={(e) => props.onChange(e.target.checked)}
          aria-describedby={props.hint ? `${id}-hint` : undefined} />
        {props.label}
      </label>
      {props.hint ? <span id={`${id}-hint`} className="field__hint">{props.hint}</span> : null}
    </div>
  );
}
