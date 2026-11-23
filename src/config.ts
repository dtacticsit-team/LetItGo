// Central, configurable product settings.
export const CONFIG = {
  /** Maximum recording length in milliseconds (PRD: 5 minutes, configurable). */
  RECORDING_LIMIT_MS: 5 * 60 * 1000,
  /** How long the completion screen must be shown before actions unlock. */
  COMPLETION_LOCK_MS: 5000,
  /** Number of waveform bars shown in live/review views. */
  WAVEFORM_BARS: 64,
  /** Paper render resolution (portrait). */
  PAPER_W: 600,
  PAPER_H: 780,
} as const;
