import { useEffect, useState, type ReactNode } from 'react';
import { SessionProvider, useSession } from './state/SessionContext';
import Header from './components/Header';
import Modal from './components/Modal';
import LandingScreen from './features/landing/LandingScreen';
import RecordingScreen from './features/recording/RecordingScreen';
import PermissionScreen from './features/recording/PermissionScreen';
import ReviewScreen from './features/recording/ReviewScreen';
import ChooseScreen from './features/destruction/ChooseScreen';
import DestructionScreen from './features/destruction/DestructionScreen';
import CompletionScreen from './features/completion/CompletionScreen';
import InputChoiceScreen from './features/input/InputChoiceScreen';
import TypingScreen from './features/input/TypingScreen';
import { runCleanup } from './utils/cleanup';
import { trackAnalytics } from './analytics';

function Shell() {
  const { state, dispatch, exitSession, language, setLanguage, t } = useSession();
  const [confirmExit, setConfirmExit] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(() => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('language') : null;
    return !stored || stored === 'false';
  });
  const [showDesktopPrompt, setShowDesktopPrompt] = useState(false);
  const { phase } = state;

  // Cleanup phase: central teardown, then move on to the calm completion screen.
  useEffect(() => {
    if (phase === 'cleanup') {
      runCleanup();
      dispatch({ type: 'CLEANUP_DONE' });
    }
  }, [phase, dispatch]);

  useEffect(() => {
    trackAnalytics('screen_view', { screen: phase, app_session_id: state.sessionId });
  }, [phase, state.sessionId]);

  // Closing or hiding the tab releases everything in memory.
  useEffect(() => {
    const onHide = () => runCleanup();
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, []);

  // Leaving while a recording, typed message, or review is in progress needs confirmation.
  const hasPrivateContent =
    phase === 'recording' || phase === 'typing' || phase === 'review' || phase === 'choosing' || phase === 'initializing';

  const handleExit = () => {
    if (hasPrivateContent) setConfirmExit(true);
    else exitSession();
  };

  let content: ReactNode;
  switch (phase) {
    case 'landing':
      content = <LandingScreen onStart={() => dispatch({ type: 'START_SESSION' })} />;
      break;
    case 'inputChoice':
      content = <InputChoiceScreen />;
      break;
    case 'typing':
      content = <TypingScreen />;
      break;
    case 'initializing':
    case 'recording':
      content = <RecordingScreen />;
      break;
    case 'permission':
      content = state.permissionError ? (
        <PermissionScreen
          error={state.permissionError}
          onRetry={() => dispatch({ type: 'REQUEST_MIC' })}
          onBack={exitSession}
        />
      ) : (
        <LandingScreen onStart={() => dispatch({ type: 'START_SESSION' })} />
      );
      break;
    case 'review':
      content = <ReviewScreen />;
      break;
    case 'choosing':
      content = <ChooseScreen />;
      break;
    case 'burning':
    case 'shredding':
      content = <DestructionScreen />;
      break;
    case 'completed':
      content = <CompletionScreen />;
      break;
    case 'cleanup':
    default:
      content = <div className="flex-1" aria-busy="true" />;
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-[#101010] text-[#F5F2EA] [background:radial-gradient(ellipse_at_top,#1a1917_0%,#101010_60%)]">
      <Header
        muted={state.muted}
        onToggleMute={() => dispatch({ type: 'TOGGLE_MUTE' })}
        onExit={phase === 'landing' ? undefined : handleExit}
        language={language}
        onSelectLanguage={setLanguage}
      />
      {content}

      <Modal
        open={confirmExit}
        title={t.confirmExitModal.title}
        confirmLabel={t.confirmExitModal.confirm}
        cancelLabel={t.confirmExitModal.stay}
        onCancel={() => setConfirmExit(false)}
        onConfirm={() => {
          setConfirmExit(false);
          exitSession();
        }}
      >
        {t.confirmExitModal.message}
      </Modal>

      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="language-modal-title"
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#1A1917] p-7 text-center shadow-2xl"
          >
            <h2 id="language-modal-title" className="font-serif text-2xl text-[#F5F2EA]">
              {t.languageModal.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#A7A29A]">
              {t.languageModal.subtitle}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => {
                  setLanguage('en');
                  setShowLanguageModal(false);
                  setShowDesktopPrompt(true);
                }}
                className="flex-1 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-base font-medium text-[#F5F2EA] transition hover:border-amber-500/50 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                {t.languageModal.english}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage('ta');
                  setShowLanguageModal(false);
                  setShowDesktopPrompt(true);
                }}
                className="flex-1 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-base font-medium text-[#F5F2EA] transition hover:border-amber-500/50 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                {t.languageModal.tamil}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDesktopPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="desktop-modal-title"
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#1A1917] p-7 text-center shadow-2xl"
          >
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-amber-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <h2 id="desktop-modal-title" className="font-serif text-2xl text-[#F5F2EA]">
              {t.desktopModal.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#A7A29A]">
              {t.desktopModal.message}
            </p>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setShowDesktopPrompt(false)}
                className="w-full rounded-full border border-amber-500/30 bg-amber-500 px-6 py-3 text-base font-semibold text-black transition hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                {t.desktopModal.button}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <Shell />
    </SessionProvider>
  );
}
