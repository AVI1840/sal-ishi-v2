/** "פעילות אחת" / "3 פעילויות": מספר עם שם עצם, בהתאמה. */
export function count(n: number, one: string, many: string): string {
  return n === 1 ? one : `${n} ${many}`;
}
