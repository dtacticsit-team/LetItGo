import { useEffect, useState } from 'react';
import Button from '../../components/Button';
import { CONFIG } from '../../config';
import { useSession } from '../../state/SessionContext';

export default function CompletionScreen() {
  const { exitSession, t } = useSession();
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);

  // Hold the calm moment for a few seconds before actions become available.
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), CONFIG.COMPLETION_LOCK_MS);
    return () => window.clearTimeout(id);
  }, []);

  const handleShare = async () => {
    const shareUrl = 'https://guessme.co';
    const shareData = {
      title: t.completion.shareTitle,
      text: t.completion.shareText,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // Fallback to clipboard if share was cancelled or failed
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${t.completion.shareText}\n${shareUrl}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: prompt or ignore
    }
  };

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 pb-10 text-center">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div className="h-[46vmin] w-[46vmin] rounded-full border border-amber-500/20 bg-[radial-gradient(circle,rgba(245,158,11,0.14),transparent_70%)] animate-[breathe_8s_ease-in-out_infinite]" />
      </div>

      <div className="relative max-w-md animate-[rise_1.4s_ease-out]">
        <h1 className="font-serif text-4xl text-[#F5F2EA] sm:text-5xl">{t.completion.heading}</h1>
        <p className="mt-5 text-base leading-relaxed text-[#A7A29A]">{t.completion.subheading}</p>

        <div className="mt-12 flex flex-col items-center gap-3">
          {!ready ? (
            <p className="py-6 text-sm tracking-wide text-[#A7A29A]/80 animate-[fadeIn_0.5s_ease-out]" aria-live="polite">
              {t.completion.takeTime}
            </p>
          ) : (
            <div className="flex w-full flex-col items-center gap-3 animate-[fadeIn_0.6s_ease-out]">
              <Button
                variant="secondary"
                size="lg"
                onClick={exitSession}
                className="w-full max-w-xs"
              >
                {t.completion.finish}
              </Button>
              <Button
                size="lg"
                onClick={handleShare}
                className="w-full max-w-xs flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>{copied ? t.completion.shareCopied : t.completion.shareBtn}</span>
              </Button>
              <p className="mt-3 text-xs text-[#A7A29A]/70" aria-live="polite">
                {t.completion.keptNotice}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
