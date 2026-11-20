import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type Dispatch, type ReactNode } from 'react';
import { initialSession, sessionReducer, type SessionAction, type SessionState } from './sessionStore';
import { prefersReducedMotion, isLowPowerDevice } from '../utils/permissions';
import { runCleanup } from '../utils/cleanup';
import { translations, type Language, type Translations } from '../utils/i18n';

interface SessionContextValue {
  state: SessionState;
  dispatch: Dispatch<SessionAction>;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  lowPower: boolean;
  /** Runs full cleanup, then returns to the landing page. */
  exitSession: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialSession);
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => prefersReducedMotion());
  const [lowPower] = useState<boolean>(() => isLowPowerDevice());
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('language') : null;
    return stored === 'ta' ? 'ta' : 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      if (lang === 'ta') {
        document.documentElement.classList.add('lang-ta');
      } else {
        document.documentElement.classList.remove('lang-ta');
      }
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      if (language === 'ta') {
        document.documentElement.classList.add('lang-ta');
      } else {
        document.documentElement.classList.remove('lang-ta');
      }
    }
  }, [language]);

  const exitSession = useCallback(() => {
    runCleanup();
    dispatch({ type: 'EXIT_SESSION' });
  }, []);

  const t = useMemo(() => translations[language], [language]);

  const value = useMemo(
    () => ({ state, dispatch, reducedMotion, setReducedMotion, lowPower, exitSession, language, setLanguage, t }),
    [state, reducedMotion, lowPower, exitSession, language, setLanguage, t],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
