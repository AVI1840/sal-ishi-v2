/** סטטוס כלל מההגדרות, בעברית: "proposal - ..." מוצג כ"הצעה: ...". */
export function statusText(status: unknown): string {
  return String(status ?? "").replace(/^proposal\s*-?\s*/i, "הצעה: ").replace(/^proposal$/i, "הצעה");
}
