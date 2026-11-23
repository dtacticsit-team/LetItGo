import { useEffect } from 'react';
import Button from '../../components/Button';
import { LiveWaveform } from '../../components/Waveform';
import { useRecorder } from '../../hooks/useRecorder';
import { useSession } from '../../state/SessionContext';
import { CONFIG } from '../../config';
import { mapMicError } from '../../utils/permissions';
import { formatDuration } from '../../utils/format';

export default function RecordingScreen() {
  const { state, dispatch, t } = useSession();

  const rec = useRecorder({
    onStarted: () => dispatch({ type: 'MIC_READY' }),
    onStartError: (err) => dispatch({ type: 'MIC_FAILED', error: mapMicError(err) }),
    onFinish: (recording) => dispatch({ type: 'FINISH_RECORDING', recording }),
  });

  // Microphone is requested only after the user explicitly chooses to record.
  useEffect(() => {
    if (state.phase === 'initializing') void rec.start();
  }, [state.phase, rec.start]);

  const { status, elapsed, analyser, error } = rec;
  const active = status === 'recording' || status === 'paused' || status === 'stopping';
  const remaining = Math.max(0, CONFIG.RECORDING_LIMIT_MS - elapsed);
  const limitMinutes = Math.round(CONFIG.RECORDING_LIMIT_MS / 60000);

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return t.recording.ready;
      case 'starting':
        return t.recording.waitingMic;
      case 'recording':
        return t.recording.recording;
      case 'paused':
        return t.recording.paused;
      case 'stopping':
        return t.recording.saving;
      default:
        return '';
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pb-10 text-center">
      <div className="w-full max-w-md">
        {state.notice && (
          <p className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#A7A29A]" role="status">
            {state.notice}
          </p>
        )}

        {/* Status line */}
        <div className="mb-6 flex items-center justify-center gap-3 text-sm tracking-wide text-[#A7A29A]" aria-live="polite">
          <span className="relative flex h-3 w-3">
            {status === 'recording' && <span className="absolute inset-0 animate-ping rounded-full bg-amber-500/70" />}
            <span
              className={`relative h-3 w-3 rounded-full ${
                status === 'recording' ? 'bg-amber-500' : status === 'paused' ? 'bg-[#A7A29A]' : 'bg-white/20'
              }`}
            />
          </span>
          <span>{getStatusText()}</span>
        </div>

        <h1 className="font-serif text-3xl text-[#F5F2EA] sm:text-4xl">
          {active ? t.recording.headingActive : t.recording.headingIdle}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#A7A29A]">
          {t.recording.privacyNote}
        </p>

        {/* Waveform */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-[#1A1917]/80 px-5 py-6">
          <LiveWaveform analyser={analyser} active={status === 'recording'} />
          <div className="mt-4 flex items-end justify-between">
            <div className="text-left">
              <p className="font-mono text-3xl tabular-nums text-[#F5F2EA]" aria-label="Recording duration">
                {formatDuration(elapsed)}
              </p>
              <p className="mt-1 text-xs text-[#A7A29A]">
                {active
                  ? t.recording.durationLeft(formatDuration(remaining), limitMinutes)
                  : t.recording.durationLimit(limitMinutes)}
              </p>
            </div>
            {status === 'recording' && (
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-400">
                {t.recording.micLive}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-6 rounded-2xl border border-red-400/30 bg-red-950/30 px-5 py-4 text-left text-sm text-red-200">
            <p>{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="mt-8 flex flex-col items-center gap-4">
          {status === 'idle' && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'REQUEST_MIC' })}
              aria-label="Start recording"
              className="group grid h-24 w-24 place-items-center rounded-full bg-amber-500 text-[#101010] shadow-[0_0_60px_-10px_rgba(245,158,11,0.7)] transition hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}

          {(status === 'recording' || status === 'paused' || status === 'stopping') && (
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              {status === 'paused' ? (
                <Button onClick={rec.resume} className="flex-1 sm:flex-none sm:min-w-40">
                  {t.recording.resume}
                </Button>
              ) : (
                <Button variant="secondary" onClick={rec.pause} disabled={status === 'stopping'} className="flex-1 sm:flex-none sm:min-w-40">
                  {t.recording.pause}
                </Button>
              )}
              <Button onClick={rec.stop} disabled={status === 'stopping'} className="flex-1 sm:flex-none sm:min-w-40">
                {t.recording.stop}
              </Button>
            </div>
          )}

          {active && status !== 'stopping' && (
            <button
              type="button"
              onClick={rec.discard}
              className="text-sm text-[#A7A29A] underline-offset-4 hover:text-[#F5F2EA] hover:underline"
            >
              {t.recording.discard}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
