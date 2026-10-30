import { useState } from "react";
import LegacyApp from "./LegacyApp";
import { seedDemo } from "./pilot/demoSeed";

// גרסה 0.5 מאוחדת: הכלי הקיים הוא הבסיס. מה שנבנה ב-0.5 (מנוע, כללים, נגישות,
// מיון פניות) נכנס לתוך המסכים הקיימים, בשפה העיצובית שלהם.
export default function App() {
  // נקודת ההתחלה של ההדגמה, אחרי שהקטלוג נטען (main.tsx).
  useState(() => seedDemo());
  return <LegacyApp />;
}
