import { useEffect, useRef, useState } from 'react';
import Button from '../../components/Button';
import { useSession } from '../../state/SessionContext';
import { renderPaper, renderPaperWithText } from '../../engines/paper/paperRenderer';
import { runBurn, type SceneHandle } from '../../engines/destruction/burnScene';
import { runShred } from '../../engines/destruction/shredScene';
import { Sfx } from '../../engines/audio/sfx';

/**
 * Hosts the burn or shred scene. Canvases are created per run and removed on teardown,
 * so no stale GPU or 2D context is reused between sessions.
 */
export default function DestructionScreen() {
  const { state, dispatch, reducedMotion, lowPower, t } = useSession();
  const { mode, paperSeed, paperStrokes, muted, inputMode, typedText } = state;
  const containerRef = useRef<HTMLDivElement>(null);
  const sfxRef = useRef<Sfx | null>(null);
  const skipRef = useRef<() => void>(() => undefined);
  const mutedRef = useRef(muted);
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);

  useEffect(() => {
    mutedRef.current = muted;
    sfxRef.current?.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !mode) return;

    let cancelled = false;
    let finished = false;
    let timer: number | undefined;
    let handle: SceneHandle | null = null;
    let sfx: Sfx | null = null;
    let paper: HTMLCanvasElement | null = null;
    const created: HTMLCanvasElement[] = [];

    const finish = () => {
      if (cancelled || finished) return;
      finished = true;
      dispatch({ type: 'DESTRUCTION_DONE' });
    };

    const makeCanvas = () => {
      const c = document.createElement('canvas');
      c.className = 'absolute inset-0 h-full w-full';
      container.appendChild(c);
      created.push(c);
      return c;
    };

    const start = (p: HTMLCanvasElement) => {
      paper = p;
      try {
        sfx = new Sfx(mutedRef.current, lowPower);
      } catch {
        sfx = null; // Sound is optional; the animation still runs silently.
      }
      sfxRef.current = sfx;

      try {
        if (mode === 'burn') {
          handle = runBurn({
            glCanvas: makeCanvas(),
            fxCanvas: makeCanvas(),
            paper: p,
            seed: paperSeed,
            reducedMotion,
            lowPower,
            sfx,
            onDone: finish,
          });
        } else {
          handle = runShred({
            canvas: makeCanvas(),
            paper: p,
            reducedMotion,
            lowPower,
            sfx,
            onDone: finish,
          });
        }
        skipRef.current = () => handle?.skip();
      } catch {
        // Lightweight fallback if WebGL/canvas is unavailable: a CSS-only dissolve.
        sfx?.dispose();
        sfxRef.current = null;
        setFallbackSrc(p.toDataURL('image/png'));
        timer = window.setTimeout(finish, reducedMotion ? 1200 : 3200);
        skipRef.current = () => {
          window.clearTimeout(timer);
          finish();
        };
      }
    };

    // Typed messages are written onto the paper in handwriting; voice recordings
    // become abstract ink marks (spoken words are never transcribed).
    const paperPromise =
      inputMode === 'text' && typedText
        ? renderPaperWithText(paperSeed, typedText)
        : renderPaper(paperSeed, paperStrokes);
    paperPromise
      .then((p) => {
        if (cancelled) {
          p.width = 0;
          p.height = 0;
          return;
        }
        start(p);
      })
      .catch(() => {
        if (!cancelled) finish();
      });

    return () => {
      cancelled = true;
      skipRef.current = () => undefined;
      if (timer !== undefined) window.clearTimeout(timer);
      handle?.stop();
      sfx?.dispose();
      sfxRef.current = null;
      created.forEach((c) => c.remove());
      if (paper) {
        paper.width = 0;
        paper.height = 0;
      }
      setFallbackSrc(null);
    };
    // Scene is started once per destruction; preferences are read at start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, paperSeed, paperStrokes, inputMode, typedText]);

  const isBurn = mode === 'burn';
  const caption = isBurn ? t.destruction.burnCaption : t.destruction.shredCaption;

  return (
    <div className="fixed inset-0 z-10 overflow-hidden bg-[#0b0a09]" data-testid="destruction-scene">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(120,60,20,0.18),transparent_60%)]" aria-hidden="true" />
      <div ref={containerRef} className="absolute inset-0" aria-hidden="true" />

      {fallbackSrc && (
        <img
          src={fallbackSrc}
          alt=""
          className={`absolute left-1/2 top-1/2 max-h-[70vh] max-w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-sm shadow-2xl ${
            isBurn ? 'animate-[fallbackBurn_3s_ease-in_forwards]' : 'animate-[fallbackShred_3s_ease-in_forwards]'
          }`}
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-20 z-10 flex flex-col items-center gap-4 px-6 text-center">
        <p aria-live="polite" className="font-serif text-xl tracking-wide text-[#F5F2EA]/85 animate-[fadeIn_1.2s_ease-out]">
          {caption}
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center">
        <Button variant="ghost" onClick={() => skipRef.current()} className="backdrop-blur-sm">
          {t.destruction.skip}
        </Button>
      </div>
    </div>
  );
}
