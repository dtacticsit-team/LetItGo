import { CONFIG } from '../../config';
import { registerCleanup } from '../../utils/cleanup';
import type { RecordingData } from '../../types';

export type RecorderState = 'recording' | 'paused' | 'stopped';

export interface RecorderCallbacks {
  onTick: (elapsedMs: number) => void;
  onAutoStop: () => void;
  onError: (message: string) => void;
}

export interface Recorder {
  readonly analyser: AnalyserNode;
  pause(): void;
  resume(): void;
  /** Stops recording and resolves with the in-memory audio. */
  stop(): Promise<RecordingData>;
  /** Stops and discards everything without producing a recording. */
  abort(): void;
  elapsed(): number;
  state(): RecorderState;
}

export function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

/**
 * Starts a microphone recording held entirely in memory.
 * No data is sent anywhere; the audio never leaves the browser.
 */
export async function startRecorder(cb: RecorderCallbacks): Promise<Recorder> {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    throw new Error('UNSUPPORTED');
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
  });

  const mimeType = pickMimeType();
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  } catch {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error('UNSUPPORTED');
  }

  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.6;
  source.connect(analyser); // Analyser only: nothing is routed to speakers.

  let chunks: Blob[] = [];
  let st: RecorderState = 'recording';
  let accumulated = 0;
  let startedAt = performance.now();
  let released = false;
  let timer: number | undefined;
  let resolveStop: ((d: RecordingData) => void) | null = null;
  let rejectStop: ((e: Error) => void) | null = null;

  const elapsed = () => accumulated + (st === 'recording' ? performance.now() - startedAt : 0);

  /** Idempotent teardown of every audio resource. */
  const release = () => {
    if (released) return;
    released = true;
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
    recorder.ondataavailable = null;
    recorder.onerror = null;
    recorder.onstop = null;
    stream.getTracks().forEach((t) => t.stop());
    try {
      source.disconnect();
      analyser.disconnect();
    } catch {
      /* already disconnected */
    }
    ctx.close().catch(() => undefined);
    chunks = [];
    st = 'stopped';
  };

  const unregister = registerCleanup(() => {
    try {
      if (recorder.state !== 'inactive') recorder.stop();
    } catch {
      /* ignore */
    }
    release();
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  recorder.onerror = () => {
    const reject = rejectStop;
    rejectStop = null;
    resolveStop = null;
    release();
    unregister();
    cb.onError('Recording stopped unexpectedly. Please try again.');
    reject?.(new Error('RECORDER_ERROR'));
  };

  recorder.onstop = () => {
    const finalMime = recorder.mimeType || mimeType || 'audio/webm';
    const blob = new Blob(chunks, { type: finalMime });
    const durationMs = Math.min(elapsed(), CONFIG.RECORDING_LIMIT_MS);
    const resolve = resolveStop;
    resolveStop = null;
    rejectStop = null;
    release();
    unregister();
    resolve?.({ blob, durationMs, mimeType: finalMime });
  };

  recorder.start(1000);
  startedAt = performance.now();

  timer = window.setInterval(() => {
    const ms = elapsed();
    cb.onTick(ms);
    if (ms >= CONFIG.RECORDING_LIMIT_MS && st === 'recording') {
      cb.onAutoStop();
    }
  }, 100);

  return {
    analyser,
    pause() {
      if (st !== 'recording' || recorder.state !== 'recording') return;
      recorder.pause();
      accumulated = elapsed();
      st = 'paused';
    },
    resume() {
      if (st !== 'paused' || recorder.state !== 'paused') return;
      recorder.resume();
      startedAt = performance.now();
      st = 'recording';
    },
    stop() {
      return new Promise<RecordingData>((resolve, reject) => {
        if (released || recorder.state === 'inactive') {
          reject(new Error('ALREADY_STOPPED'));
          return;
        }
        resolveStop = resolve;
        rejectStop = reject;
        accumulated = elapsed();
        st = 'stopped';
        recorder.stop();
      });
    },
    abort() {
      try {
        if (recorder.state !== 'inactive') {
          recorder.onstop = null;
          recorder.stop();
        }
      } catch {
        /* ignore */
      }
      unregister();
      release();
    },
    elapsed,
    state: () => st,
  };
}
