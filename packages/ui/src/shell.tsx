// מעטפת האפליקציה: קישור דילוג, כותרת, ניווט, תוכן ראשי ותחתית עם הצהרת נגישות.

import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

export interface NavItem {
  to: string;
  label: string;
  icon?: ReactNode;
}

export function AppShell(props: {
  appName: string;
  nav: NavItem[];
  headerMeta?: ReactNode;
  banner?: ReactNode;
  footerNote?: ReactNode;
  children: ReactNode;
}) {
  const mainRef = useRef<HTMLElement>(null);
  const location = useLocation();

  // מעבר מסך: הפוקוס עובר לתוכן הראשי כדי שקורא מסך יקרא את המסך החדש.
  // משווים לנתיב הקודם (ולא לדגל "טעינה ראשונה") כי StrictMode מריץ אפקטים פעמיים.
  const prevPath = useRef(location.pathname);
  useEffect(() => {
    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;
    mainRef.current?.focus();
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>
        דילוג לתוכן הראשי
      </a>
      {props.banner}
      <header className="app-header">
        <div className="app-header__bar">
          <div className="app-header__title">
            <span className="app-header__org">המוסד לביטוח לאומי</span>
            <span className="app-header__name">{props.appName}</span>
          </div>
          {props.headerMeta ? <div className="app-header__meta">{props.headerMeta}</div> : null}
        </div>
      </header>
      <nav className="app-nav" aria-label="ניווט ראשי">
        <ul>
          {props.nav.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.to === "/"}>
                {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main id="main" className="app-main" ref={mainRef} tabIndex={-1}>
        {props.children}
      </main>
      <footer className="app-footer">
        <span>{props.footerNote}</span>
        <NavLink to="/accessibility">הצהרת נגישות</NavLink>
      </footer>
    </>
  );
}

export function PageHeader(props: { title: string; description?: ReactNode; actions?: ReactNode }) {
  useEffect(() => {
    document.title = `${props.title} | אטלס וקטלוג סל אישי`;
  }, [props.title]);
  return (
    <div className="page-header">
      <div className="page-header__text">
        <h1>{props.title}</h1>
        {props.description ? <p className="page-header__desc">{props.description}</p> : null}
      </div>
      {props.actions ? <div className="actions">{props.actions}</div> : null}
    </div>
  );
}

export function AccessibilityStatement(props: { contact: string; updated: string }) {
  return (
    <>
      <PageHeader title="הצהרת נגישות" />
      <section className="card" aria-labelledby="a11y-h">
        <h2 id="a11y-h">רמת הנגישות</h2>
        <p>
          הכלי נבנה בהתאם לתקן הישראלי 5568 ולהנחיות WCAG 2.1 ברמה AA: ניווט מלא במקלדת, קישור לדילוג לתוכן,
          תוויות לכל שדה, הודעות שגיאה שמוקראות, ניגודיות צבעים מספקת, וסטטוסים שמוצגים בטקסט ובסמל ולא רק בצבע.
        </p>
        <p>טבלאות וקבצי Excel שמיוצאים מהכלי בנויים מימין לשמאל.</p>
        <h2>נתקלתם בבעיה?</h2>
        <p>{props.contact}</p>
        <p className="muted">עודכן: {props.updated}</p>
      </section>
    </>
  );
}
