import { useEffect, useRef, useState } from 'react';
import Button from '../../components/Button';
import { StaticWaveform } from '../../components/Waveform';
import { useSession } from '../../state/SessionContext';
import { CONFIG } from '../../config';
import { createPlayback, decodePeaks, type Playback } from '../../engines/audio/playback';
import { formatDuration } from '../../utils/format';

export default function ReviewScreen() {
  const { state, dispatch, t } = useSession();
  const recording = state.recording;
  const [peaks, setPeaks] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);
  const playbackRef = useRef<Playback | null>(null);

  // Create playback for this recording and destroy it (revoking its URL) on unmount or change.
  useEffect(() => {
    if (!recording) return;
    setPlayError(null);
    const pb = createPlayback(recording.blob, {
      onEnded: () => {
        setPlaying(false);
        setProgress(0);
      },
      onError: () => {
        setPlaying(false);
        setPlayError(t.review.playbackUnavailable);
      },
      onProgress: () => setProgress(pb.progress()),
    });
    playbackRef.current = pb;
    pb.setMuted(state.muted);
    return () => {
      pb.destroy();
      if (playbackRef.current === pb) playbackRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  useEffect(() => {
    playbackRef.current?.setMuted(state.muted);
  }, [state.muted]);

  useEffect(() => {
    let cancelled = false;
    if (!recording) return;
    decodePeaks(recording.blob, CONFIG.WAVEFORM_BARS).then((p) => {
      if (!cancelled) setPeaks(p);
    });
    return () => {
      cancelled = true;
    };
  }, [recording]);

  if (!recording) return null;

  const togglePlay = async () => {
    const pb = playbackRef.current;
    if (!pb) return;
    if (pb.isPlaying()) {
      pb.pause();
      setPlaying(false);
      return;
    }
    try {
      await pb.play();
      setPlaying(true);
      setPlayError(null);
    } catch {
      setPlaying(false);
      setPlayError(t.review.playbackError);
    }
  };

  const seek = (fraction: number) => {
    playbackRef.current?.seek(fraction);
    setProgress(fraction);
  };

  const hitLimit = recording.durationMs >= CONFIG.RECORDING_LIMIT_MS - 1000;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pb-10 text-center">
      <div className="w-full max-w-md">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-500/90">{t.review.tagline}</p>
        <h1 className="mt-3 font-serif text-3xl text-[#F5F2EA] sm:text-4xl">{t.review.heading}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#A7A29A]">
          {t.review.subheading}
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-[#1A1917]/80 px-5 py-6">
          {peaks.length > 0 ? (
            <StaticWaveform peaks={peaks} progress={progress} onSeek={seek} label={t.review.playLabel} />
          ) : (
            <div className="h-28 animate-pulse rounded-xl bg-white/[0.03]" aria-hidden="true" />
          )}
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? t.review.pauseLabel : t.review.playLabel}
              className="grid h-14 w-14 place-items-center rounded-full bg-[#F5F2EA] text-[#101010] transition hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
            >
              {playing ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="translate-x-[1px]">
                  <path d="M7 4.5v15l12-7.5z" />
                </svg>
              )}
            </button>
            <p className="font-mono text-2xl tabular-nums text-[#F5F2EA]" aria-label="Recording duration">
              {formatDuration(recording.durationMs)}
            </p>
          </div>
          {hitLimit && <p className="mt-4 text-xs text-amber-400/90">{t.review.hitLimit(Math.round(CONFIG.RECORDING_LIMIT_MS / 60000))}</p>}
        </div>

        {playError && (
          <p role="alert" className="mt-5 rounded-2xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {playError}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <Button size="lg" onClick={() => dispatch({ type: 'CHOOSE_DESTRUCTION' })} className="w-full">
            {t.review.continueBtn}
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => dispatch({ type: 'DISCARD_RECORDING' })} className="flex-1">
              {t.review.recordAgain}
            </Button>
            <Button
              variant="ghost"
              onClick={() => dispatch({ type: 'DISCARD_RECORDING', notice: t.review.deleteNotice })}
              className="flex-1"
            >
              {t.review.deleteBtn}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
