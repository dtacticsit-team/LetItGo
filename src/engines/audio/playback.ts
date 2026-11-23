import { registerCleanup } from '../../utils/cleanup';

export interface Playback {
  play(): Promise<void>;
  pause(): void;
  seek(fraction: number): void;
  setMuted(muted: boolean): void;
  progress(): number;
  isPlaying(): boolean;
  destroy(): void;
}

/**
 * Plays a recording from an in-memory Blob via a temporary object URL.
 * The URL is revoked on destroy, and destroy is registered with the central cleanup.
 */
export function createPlayback(
  blob: Blob,
  cb: { onEnded: () => void; onError: () => void; onProgress?: () => void },
): Playback {
  const url = URL.createObjectURL(blob);
  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = url;
  let destroyed = false;

  const onEnded = () => cb.onEnded();
  const onError = () => cb.onError();
  const onTime = () => cb.onProgress?.();
  audio.addEventListener('ended', onEnded);
  audio.addEventListener('error', onError);
  audio.addEventListener('timeupdate', onTime);

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    audio.removeEventListener('ended', onEnded);
    audio.removeEventListener('error', onError);
    audio.removeEventListener('timeupdate', onTime);
    try {
      audio.pause();
    } catch {
      /* ignore */
    }
    audio.removeAttribute('src');
    audio.load();
    URL.revokeObjectURL(url);
  };

  const unregister = registerCleanup(destroy);

  return {
    async play() {
      if (destroyed) return;
      await audio.play();
    },
    pause() {
      if (!destroyed) audio.pause();
    },
    seek(fraction: number) {
      if (destroyed) return;
      const d = Number.isFinite(audio.duration) ? audio.duration : 0;
      if (d > 0) audio.currentTime = Math.max(0, Math.min(1, fraction)) * d;
    },
    setMuted(muted: boolean) {
      if (!destroyed) audio.muted = muted;
    },
    progress() {
      const d = Number.isFinite(audio.duration) ? audio.duration : 0;
      return d > 0 ? Math.min(1, audio.currentTime / d) : 0;
    },
    isPlaying() {
      return !destroyed && !audio.paused;
    },
    destroy() {
      destroy();
      unregister();
    },
  };
}

/**
 * Decodes amplitude peaks for the review waveform.
 * Falls back to a deterministic pseudo-waveform if the browser cannot decode the blob.
 */
export async function decodePeaks(blob: Blob, bars: number): Promise<number[]> {
  const fallback = () => Array.from({ length: bars }, (_, i) => 0.25 + 0.55 * Math.abs(Math.sin(i * 0.73) * Math.cos(i * 0.21)));
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  let ctx: AudioContext | null = null;
  try {
    ctx = new AC();
    const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
    const data = buffer.getChannelData(0);
    const block = Math.max(1, Math.floor(data.length / bars));
    const peaks: number[] = [];
    let max = 0;
    for (let i = 0; i < bars; i++) {
      let sum = 0;
      const start = i * block;
      for (let j = 0; j < block; j++) sum += data[start + j] ? data[start + j] * data[start + j] : 0;
      const rms = Math.sqrt(sum / block);
      peaks.push(rms);
      if (rms > max) max = rms;
    }
    if (max <= 0) return fallback();
    return peaks.map((p) => 0.12 + 0.88 * (p / max));
  } catch {
    return fallback();
  } finally {
    ctx?.close().catch(() => undefined);
  }
}
