import { useSession } from '../../state/SessionContext';
import type { InputMode } from '../../types';

export default function InputChoiceScreen() {
  const { dispatch, t } = useSession();

  const choose = (mode: InputMode) => dispatch({ type: 'CHOOSE_INPUT', mode });

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pb-10 text-center">
      <div className="w-full max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-500/90">{t.inputChoice.tagline}</p>
        <h1 className="mt-3 font-serif text-3xl text-[#F5F2EA] sm:text-4xl">{t.inputChoice.heading}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#A7A29A]">
          {t.inputChoice.subheading}
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => choose('voice')}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#1A1917] p-7 text-left transition duration-500 hover:-translate-y-1 hover:border-amber-500/40 focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(245,158,11,0.22),transparent_70%)] opacity-60 transition group-hover:opacity-100" aria-hidden="true" />
            <div className="relative">
              <span className="text-amber-400" aria-hidden="true">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <h2 className="mt-4 font-serif text-2xl text-[#F5F2EA]">{t.inputChoice.speakTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#A7A29A]">{t.inputChoice.speakDesc}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => choose('text')}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#1A1917] p-7 text-left transition duration-500 hover:-translate-y-1 hover:border-amber-500/40 focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(232,220,196,0.16),transparent_70%)] opacity-60 transition group-hover:opacity-100" aria-hidden="true" />
            <div className="relative">
              <span className="text-[#E8DCC4]" aria-hidden="true">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </span>
              <h2 className="mt-4 font-serif text-2xl text-[#F5F2EA]">{t.inputChoice.writeTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#A7A29A]">{t.inputChoice.writeDesc}</p>
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}

