import { useEffect, type CSSProperties } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { CalendarCheck, Home, LifeBuoy, Square, Type, Volume2 } from "lucide-react";
import { DemoBar, OfflineBanner, useOnline } from "../components/Frame";
import { LANG_META, useT } from "../i18n";
import type { Lang } from "../model";
import { appSettings } from "../settings";
import { setLang, setTextScale, usePilot } from "../store";
import { useReadAloud } from "../speech";
import { useAutoSync } from "../sync";
import { useCitizen } from "./common";

const SCALES = [1, 1.25, 1.5] as const;

export default function CitizenShell() {
  const { state, derived } = usePilot();
  const { t, lang } = useT();
  const meta = LANG_META[lang];
  const online = useOnline();
  useAutoSync(online);
  const { profile } = useCitizen();
  const { speaking, read, stop, supported } = useReadAloud(meta.speech);
  const { pathname } = useLocation();

  useEffect(() => stop(), [pathname, stop]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const nextScale = SCALES[(SCALES.indexOf(state.textScale) + 1) % SCALES.length];
  const tabs = [
    { to: "/citizen", end: true, label: t.navHome, Icon: Home },
    { to: "/citizen/activities", end: false, label: t.navActivities, Icon: CalendarCheck },
    { to: "/citizen/help", end: false, label: t.navHelp, Icon: LifeBuoy },
  ];

  return (
    <div className="pilot pilot--citizen" dir={meta.dir} lang={lang} style={{ "--p-scale": state.textScale } as CSSProperties}>
      <a
        className="p-skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        {t.skipToContent}
      </a>
      <DemoBar />
      <header className="p-topbar">
        <NavLink to="/citizen" className="p-topbar__title">
          {t.appName}
        </NavLink>
        <div className="p-topbar__tools">
          {supported ? (
            <button type="button" className="p-tool" aria-pressed={speaking} onClick={speaking ? stop : read}>
              {speaking ? <Square aria-hidden="true" size={18} /> : <Volume2 aria-hidden="true" size={20} />}
              {speaking ? t.stopReading : t.readAloud}
            </button>
          ) : null}
          <button
            type="button"
            className="p-tool"
            onClick={() => setTextScale(nextScale)}
            aria-label={`${t.textSize}: ${t.textSizeLabel(state.textScale)}`}
          >
            <Type aria-hidden="true" size={18} />
            <span aria-hidden="true">א+</span>
          </button>
          <label className="p-tool">
            <span className="p-visually-hidden">{t.language}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
              {appSettings.citizen.languages.map((l) => (
                <option key={l} value={l}>
                  {LANG_META[l as Lang]?.label ?? l}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      {meta.draft ? (
        <div className="p-banner p-banner--draft" role="note">
          <p>{t.draftTranslation}</p>
        </div>
      ) : null}
      {!online ? <OfflineBanner text={t.offline} /> : null}
      {derived.hospitalized.has(profile.id) ? (
        <div className="p-banner p-banner--hospital" role="status">
          <p>{t.hospitalized}</p>
        </div>
      ) : null}
      <main id="main" tabIndex={-1} className="p-main" data-read>
        <Outlet />
      </main>
      <nav className="p-bottomnav" aria-label={t.navLabel} data-no-read>
        <ul>
          {tabs.map(({ to, end, label, Icon }) => (
            <li key={to}>
              <NavLink to={to} end={end}>
                <Icon aria-hidden="true" size={24} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
