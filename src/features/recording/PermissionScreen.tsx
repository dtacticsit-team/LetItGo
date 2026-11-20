import Button from '../../components/Button';
import type { PermissionError } from '../../types';
import { useSession } from '../../state/SessionContext';

interface Props {
  error: PermissionError;
  onRetry: () => void;
  onBack: () => void;
}

export default function PermissionScreen({ error, onRetry, onBack }: Props) {
  const { t } = useSession();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pb-10 text-center">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1A1917] p-8 shadow-2xl animate-[rise_0.8s_ease-out]">
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-amber-500/10 text-amber-400" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v4M4 4l16 16" />
          </svg>
        </div>
        <h1 role="alert" className="font-serif text-2xl text-[#F5F2EA]">
          {error.title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[#A7A29A]">{error.message}</p>

        <div className="mt-8 flex flex-col gap-3">
          {error.canRetry && (
            <Button onClick={onRetry} className="w-full">
              {t.permission.tryAgain}
            </Button>
          )}
          <Button variant="ghost" onClick={onBack} className="w-full">
            {t.permission.goBack}
          </Button>
        </div>
        <p className="mt-6 text-xs text-[#A7A29A]/70">
          {t.permission.disclaimer}
        </p>
      </div>
    </main>
  );
}
