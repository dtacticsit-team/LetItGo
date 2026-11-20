interface HeaderProps {
  muted: boolean;
  onToggleMute: () => void;
  onExit?: () => void;
  language?: 'en' | 'ta';
  onSelectLanguage?: (lang: 'en' | 'ta') => void;
}

export function Logo({ subtitle = 'Let It Go' }: { subtitle?: string }) {
  return (
    <div className="flex flex-col">
      <a
        href="https://guessme.co"
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1.5 focus:outline-none"
      >
        <span className="text-2xl font-black tracking-tight text-white transition-opacity duration-150 group-hover:opacity-85 sm:text-3xl">
          guessme.co
        </span>
      </a>
      <span className="text-xs font-medium tracking-wide text-white/80 sm:text-sm">
        {subtitle}
      </span>
    </div>
  );
}

export default function Header({ muted, onToggleMute, onExit, language = 'en', onSelectLanguage }: HeaderProps) {
  const isTa = language === 'ta';

  return (
    <header className="relative z-20 flex items-center justify-between px-5 py-4 sm:px-8">
      <Logo subtitle={isTa ? 'விட்டுவிடுங்கள்' : 'Let It Go'} />
      <div className="flex items-center gap-2.5">
        {onSelectLanguage && (
          <div
            role="group"
            aria-label="Language selector"
            className="relative inline-flex items-center rounded-full border border-white/10 bg-[#141414] p-1 shadow-inner select-none"
          >
            {/* Sliding Pill Indicator */}
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full border border-amber-500/70 bg-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)] transition-all duration-300 ease-out pointer-events-none"
              style={{
                left: isTa ? 'calc(50% + 2px)' : '4px',
              }}
            />

            {/* English Option */}
            <button
              type="button"
              onClick={() => onSelectLanguage('en')}
              className={`relative z-10 flex-1 text-center rounded-full py-1 px-3 sm:px-4 text-xs sm:text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-amber-400 ${!isTa ? 'text-amber-400 font-semibold' : 'text-[#8E8B85] hover:text-[#D5D0C7]'
                }`}
            >
              <span className="hidden sm:inline">English</span>
              <span className="inline sm:hidden">en</span>
            </button>

            {/* Tamil Option */}
            <button
              type="button"
              onClick={() => onSelectLanguage('ta')}
              className={`relative z-10 flex-1 text-center rounded-full py-1 px-3 sm:px-4 text-xs sm:text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-amber-400 ${isTa ? 'text-amber-400 font-semibold' : 'text-[#8E8B85] hover:text-[#D5D0C7]'
                }`}
            >
              <span className="hidden sm:inline">தமிழ்</span>
              <span className="inline sm:hidden">தமி</span>
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleMute}
          aria-pressed={muted}
          aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
          className="grid h-10 w-10 place-items-center rounded-full text-[#A7A29A] transition hover:bg-white/5 hover:text-[#F5F2EA] focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          {muted ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M11 5 6 9H3v6h3l5 4V5zM22 9l-6 6M16 9l6 6" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M11 5 6 9H3v6h3l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
            </svg>
          )}
        </button>
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-[#A7A29A] transition hover:border-white/25 hover:text-[#F5F2EA] focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            Exit
          </button>
        )}
      </div>
    </header>
  );
}
