import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type Dispatch, type ReactNode } from 'react';
import { initialSession, sessionReducer, type SessionAction, type SessionState } from './sessionStore';
import { prefersReducedMotion, isLowPowerDevice } from '../utils/permissions';
import { runCleanup } from '../utils/cleanup';
import { translations, type Language, type Translations } from '../utils/i18n';
import { trackAnalytics } from '../analytics';

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
    trackAnalytics('language_selected', { language: lang, app_session_id: state.sessionId });
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      if (lang === 'ta') {
        document.documentElement.classList.add('lang-ta');
      } else {
        document.documentElement.classList.remove('lang-ta');
      }
    }
  }, [state.sessionId]);

  const trackableDispatch = useCallback((action: SessionAction) => {
    const track = (eventName: string, props?: Record<string, string | number | boolean | null>) => {
      trackAnalytics(eventName, {
        app_session_id: action.type === 'START_SESSION' ? state.sessionId + 1 : state.sessionId,
        ...props,
      });
    };

    switch (action.type) {
      case 'START_SESSION':
        track('app_session_start');
        break;
      case 'CHOOSE_INPUT':
        track('input_method_selected', { input_mode: action.mode });
        break;
      case 'SUBMIT_TEXT':
        track('text_submitted');
        break;
      case 'BACK_TO_INPUT_CHOICE':
        track('input_method_back');
        break;
      case 'REQUEST_MIC':
        track('microphone_permission_requested');
        break;
      case 'MIC_READY':
        track('microphone_permission_granted');
        break;
      case 'MIC_FAILED':
        track('microphone_permission_failed');
        break;
      case 'RECORDING_STARTED':
        track('recording_started');
        break;
      case 'FINISH_RECORDING':
        track('recording_completed');
        break;
      case 'DISCARD_RECORDING':
        track('recording_discarded');
        break;
      case 'CHOOSE_DESTRUCTION':
        track('release_options_opened');
        break;
      case 'BACK_TO_REVIEW':
        track('release_options_back');
        break;
      case 'BEGIN_DESTRUCTION':
        track('content_released', { release_method: action.mode });
        break;
      case 'CLEANUP_DONE':
        track('app_session_completed');
        break;
      case 'EXIT_SESSION':
        track('app_session_exit');
        break;
      case 'TOGGLE_MUTE':
        track('sound_toggled');
        break;
      default:
        break;
    }
    dispatch(action);
  }, [dispatch, state.sessionId]);

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
    trackableDispatch({ type: 'EXIT_SESSION' });
  }, [trackableDispatch]);

  const updateReducedMotion = useCallback((enabled: boolean) => {
    setReducedMotion(enabled);
    trackAnalytics('reduced_motion_toggled', { enabled, app_session_id: state.sessionId });
  }, [state.sessionId]);

  const t = useMemo(() => translations[language], [language]);

  const value = useMemo(
    () => ({ state, dispatch: trackableDispatch, reducedMotion, setReducedMotion: updateReducedMotion, lowPower, exitSession, language, setLanguage, t }),
    [state, trackableDispatch, reducedMotion, updateReducedMotion, lowPower, exitSession, language, setLanguage, t],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
