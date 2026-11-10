/**
 * ניסוח הדוכן. מחליף ביטויים במסכים המוצגים, רק בגרסת הדוכן, בלי לגעת ברכיבים:
 * "האטה בהידרדרות" ולא "מניעת הידרדרות", ובלי מונחים באנגלית.
 */
const RULES: [RegExp, string][] = [
  [/מניעת הידרדרות/g, "האטה בהידרדרות"],
  [/דשבורד הידרדרות/g, "סימנים מוקדמים"],
  [/\s*\(seed [0-9.]+\)/g, ""],
  [/\bnudge\b/gi, "פנייה יזומה"],
];

function fix(node: Node) {
  const v = node.nodeValue;
  if (!v) return;
  let out = v;
  for (const [re, to] of RULES) out = out.replace(re, to);
  if (out !== v) node.nodeValue = out;
}

function sweep(root: Node) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) fix(n);
}

export function startBoothCopy(): () => void {
  const root = document.getElementById("root");
  if (!root) return () => {};
  sweep(root);
  const obs = new MutationObserver((muts) => {
    obs.disconnect();
    for (const m of muts) {
      if (m.type === "characterData") fix(m.target);
      m.addedNodes.forEach((n) => sweep(n));
    }
    obs.observe(root, { childList: true, subtree: true, characterData: true });
  });
  obs.observe(root, { childList: true, subtree: true, characterData: true });
  return () => obs.disconnect();
}
