import Button from '../../components/Button';
import heroUrl from '../../assets/hero.jpg';
import { useSession } from '../../state/SessionContext';

export default function LandingScreen({ onStart }: { onStart: () => void }) {
  const { t } = useSession();

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 pb-10 text-center">
      {/* Cinematic photographic backdrop with a candle-like glow. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <img
          src={heroUrl}
          alt=""
          className="h-full w-full object-cover object-[60%_center] opacity-70 animate-[fadeIn_2.5s_ease-out]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#101010]/75 via-[#101010]/50 to-[#101010]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#101010] to-transparent" />
        <div className="absolute left-1/2 top-[42%] h-[46vmin] w-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.16),transparent_65%)] animate-[breathe_5s_ease-in-out_infinite]" />
      </div>

      <div className="relative w-full max-w-4xl animate-[rise_1.2s_ease-out]">
        <p className="mb-5 text-xs uppercase tracking-[0.35em] text-amber-500/90">{t.landing.tagline}</p>
        <h1 className="mx-auto max-w-4xl font-serif text-3xl leading-tight text-[#F5F2EA] drop-shadow-[0_2px_18px_rgba(0,0,0,0.6)] sm:text-4xl md:text-5xl lg:text-6xl lg:leading-[1.2] whitespace-pre-line">
          {t.landing.heading}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#E7E1D6]/80 drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)] sm:text-lg">
          {t.landing.subheading}
        </p>

        <div className="mt-10 flex flex-col items-center gap-5">
          <Button size="lg" onClick={onStart} className="w-full max-w-xs">
            {t.landing.startBtn}
          </Button>
          <p className="max-w-sm text-xs leading-relaxed text-[#A7A29A]">
            {t.landing.privacyNote}
          </p>
        </div>
      </div>

      <p className="relative mt-10 max-w-md text-[11px] leading-relaxed text-[#A7A29A]/60">
        {t.landing.disclaimer}
      </p>
    </main>
  );
}
