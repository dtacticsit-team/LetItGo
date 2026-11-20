import type { PermissionError } from '../types';

/** Maps getUserMedia / MediaRecorder failures to clear, user-facing guidance. */
export function mapMicError(err: unknown): PermissionError {
  const name = (err as { name?: string })?.name ?? '';
  const message = err instanceof Error ? err.message : '';

  if (message === 'UNSUPPORTED') {
    return {
      title: 'Browser not supported',
      message:
        'This browser cannot record audio here. Please use the latest version of Chrome, Edge, Firefox or Safari.',
      canRetry: false,
    };
  }
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
    return {
      title: 'Microphone access is blocked',
      message:
        'To record, allow microphone access for this site. Click the lock or site-settings icon in the address bar, set Microphone to "Allow", then try again.',
      canRetry: true,
    };
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError') {
    return {
      title: 'No microphone found',
      message: 'We could not find a microphone on this device. Connect one, or try a different device, then retry.',
      canRetry: true,
    };
  }
  if (name === 'NotReadableError' || name === 'AbortError' || name === 'TrackStartError') {
    return {
      title: 'Microphone unavailable',
      message: 'The microphone is being used by another app or tab. Close it and try again.',
      canRetry: true,
    };
  }
  return {
    title: 'Something went wrong',
    message: 'Recording could not start. Please try again.',
    canRetry: true,
  };
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Heuristic for low-end devices: fewer particles and simplified effects. */
export function isLowPowerDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = navigator.hardwareConcurrency ?? 8;
  const mem = nav.deviceMemory ?? 8;
  return cores <= 4 || mem <= 4;
}
