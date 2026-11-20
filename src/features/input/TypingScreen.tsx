import { useState } from 'react';
import Button from '../../components/Button';
import { useSession } from '../../state/SessionContext';

const MAX_CHARS = 600;

export default function TypingScreen() {
  const { state, dispatch, t } = useSession();
  const [text, setText] = useState(state.typedText ?? '');
  const canContinue = text.trim().length > 0;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pb-10 text-center">
      <div className="w-full max-w-lg">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-500/90">{t.typing.tagline}</p>
        <h1 className="mt-3 font-serif text-3xl text-[#F5F2EA] sm:text-4xl">{t.typing.heading}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#A7A29A]">
          {t.typing.subheading}
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-[#1A1917]/80 p-5 text-left">
          <label htmlFor="letgo-text" className="sr-only">
            {t.typing.inputLabel}
          </label>
          <textarea
            id="letgo-text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
            maxLength={MAX_CHARS}
            rows={7}
            autoFocus
            placeholder={t.typing.placeholder}
            className="font-handwriting w-full resize-none bg-transparent text-[30px] leading-snug text-[#F5F2EA] placeholder:text-[#A7A29A]/40 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between gap-4 text-xs text-[#A7A29A]">
            <span>{t.typing.footNote}</span>
            <span className="shrink-0 tabular-nums">
              {text.length} / {MAX_CHARS}
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Button
            size="lg"
            disabled={!canContinue}
            onClick={() => dispatch({ type: 'SUBMIT_TEXT', text })}
            className="w-full"
          >
            {t.typing.continueBtn}
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setText('')} disabled={text.length === 0} className="flex-1">
              {t.typing.clearBtn}
            </Button>
            <Button variant="ghost" onClick={() => dispatch({ type: 'BACK_TO_INPUT_CHOICE' })} className="flex-1">
              {t.typing.backBtn}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

