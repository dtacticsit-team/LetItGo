import { useEffect, useRef } from 'react';
import { CONFIG } from '../config';

/** Static bar waveform for review. Click or tap to seek. */
export function StaticWaveform({
  peaks,
  progress,
  onSeek,
  label,
}: {
  peaks: number[];
  progress: number;
  onSeek?: (fraction: number) => void;
  label: string;
}) {
  return (
    <div
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      tabIndex={0}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onSeek?.((e.clientX - r.left) / r.width);
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') onSeek?.(Math.min(1, progress + 0.05));
        if (e.key === 'ArrowLeft') onSeek?.(Math.max(0, progress - 0.05));
      }}
      className="flex h-28 w-full cursor-pointer items-center gap-[3px] rounded-xl px-2 focus-visible:outline-2 focus-visible:outline-amber-400"
    >
      {peaks.map((p, i) => {
        const played = i / peaks.length < progress;
        return (
          <span
            key={i}
            className={`flex-1 rounded-full transition-colors duration-200 ${played ? 'bg-amber-500' : 'bg-[#F5F2EA]/25'}`}
            style={{ height: `${Math.max(6, p * 100)}%` }}
          />
        );
      })}
    </div>
  );
}

/** Live waveform drawn from an AnalyserNode while recording. */
export function LiveWaveform({ analyser, active }: { analyser: AnalyserNode | null; active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = new Uint8Array(analyser.fftSize);
    let raf = 0;
    let smooth: number[] = new Array(CONFIG.WAVEFORM_BARS).fill(0);

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      analyser.getByteTimeDomainData(data);

      const bars = CONFIG.WAVEFORM_BARS;
      const block = Math.floor(data.length / bars);
      const gap = 3;
      const bw = (w - gap * (bars - 1)) / bars;
      for (let i = 0; i < bars; i++) {
        let sum = 0;
        for (let j = 0; j < block; j++) {
          const v = (data[i * block + j] - 128) / 128;
          sum += v * v;
        }
        const level = active ? Math.min(1, Math.sqrt(sum / block) * 3.2) : 0;
        smooth[i] = smooth[i] * 0.6 + level * 0.4;
        const bh = Math.max(4, smooth[i] * h);
        const x = i * (bw + gap);
        const y = (h - bh) / 2;
        ctx.fillStyle = active ? '#F59E0B' : 'rgba(245,242,234,0.25)';
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bh, bw / 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      smooth = [];
    };
  }, [analyser, active]);

  return <canvas ref={ref} className="h-28 w-full" aria-hidden="true" />;
}
