import { useSession } from '../../state/SessionContext';
import type { SessionState } from '../../state/sessionStore';
import type { DestructionMode } from '../../types';

/** Ink density for the paper: roughly one stroke group per 4 seconds of speech, or per 8 characters typed. */
function strokesFor(state: SessionState): number {
  if (state.inputMode === 'text') {
    return Math.max(6, Math.min(40, Math.round((state.typedText?.length ?? 0) / 8) + 6));
  }
  return Math.max(6, Math.min(40, Math.round((state.recording?.durationMs ?? 0) / 4000) + 6));
}

export default function ChooseScreen() {
  const { state, dispatch, reducedMotion, setReducedMotion, t } = useSession();

  const choose = (mode: DestructionMode) => {
    const seed = Math.floor(Math.random() * 2147483646) + 1;
    const strokes = strokesFor(state);
    dispatch({ type: 'BEGIN_DESTRUCTION', mode, seed, strokes });
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pb-10 text-center">
      <div className="w-full max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-500/90">{t.choose.tagline}</p>
        <h1 className="mt-3 font-serif text-3xl text-[#F5F2EA] sm:text-4xl">{t.choose.heading}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#A7A29A]">
          {state.inputMode === 'text' ? t.choose.subheadingText : t.choose.subheadingVoice}
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => choose('burn')}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#1A1917] p-7 text-left transition duration-500 hover:-translate-y-1 hover:border-amber-500/40 focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(245,120,20,0.35),transparent_70%)] opacity-60 transition group-hover:opacity-100" aria-hidden="true" />
            <div className="relative">
              <span className="text-3xl" aria-hidden="true">🔥</span>
              <h2 className="mt-4 font-serif text-2xl text-[#F5F2EA]">{t.choose.burnTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#A7A29A]">{t.choose.burnDesc}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => choose('shred')}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#1A1917] p-7 text-left transition duration-500 hover:-translate-y-1 hover:border-amber-500/40 focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(245,158,11,0.12),transparent)] transition group-hover:opacity-100" aria-hidden="true" />
            <div className="relative">
              <span className="text-3xl" aria-hidden="true">✂️</span>
              <h2 className="mt-4 font-serif text-2xl text-[#F5F2EA]">{t.choose.shredTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#A7A29A]">{t.choose.shredDesc}</p>
            </div>
          </button>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-[#A7A29A]">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="h-4 w-4 accent-amber-500"
            />
            {t.choose.reduceMotion}
          </label>
          <button
            type="button"
            onClick={() => dispatch({ type: 'BACK_TO_REVIEW' })}
            className="text-sm text-[#A7A29A] underline-offset-4 hover:text-[#F5F2EA] hover:underline"
          >
            {state.inputMode === 'text' ? t.choose.backToTyping : t.choose.backToReview}
          </button>
        </div>
      </div>
    </main>
  );
}
