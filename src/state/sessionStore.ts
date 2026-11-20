import type { DestructionMode, InputMode, Phase, PermissionError, RecordingData } from '../types';

// Explicit, in-memory session state. Nothing here is persisted.
export interface SessionState {
  phase: Phase;
  sessionId: number;
  inputMode: InputMode | null;
  recording: RecordingData | null;
  /** Typed message, held only in memory and cleared at cleanup. */
  typedText: string | null;
  /** Visual seed + stroke count captured when destruction starts (no audio retained). */
  paperSeed: number;
  paperStrokes: number;
  mode: DestructionMode | null;
  permissionError: PermissionError | null;
  notice: string | null;
  muted: boolean;
  /** Increments on every reset so stale async callbacks can be ignored. */
  epoch: number;
}

export type SessionAction =
  | { type: 'START_SESSION' }
  | { type: 'CHOOSE_INPUT'; mode: InputMode }
  | { type: 'SUBMIT_TEXT'; text: string }
  | { type: 'BACK_TO_INPUT_CHOICE' }
  | { type: 'REQUEST_MIC' }
  | { type: 'MIC_READY' }
  | { type: 'MIC_FAILED'; error: PermissionError }
  | { type: 'RECORDING_STARTED' }
  | { type: 'FINISH_RECORDING'; recording: RecordingData }
  | { type: 'DISCARD_RECORDING'; notice?: string }
  | { type: 'CHOOSE_DESTRUCTION' }
  | { type: 'BACK_TO_REVIEW' }
  | { type: 'BEGIN_DESTRUCTION'; mode: DestructionMode; seed: number; strokes: number }
  | { type: 'DESTRUCTION_DONE' }
  | { type: 'CLEANUP_DONE' }
  | { type: 'SHOW_COMPLETION' }
  | { type: 'EXIT_SESSION' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_NOTICE'; notice: string | null }
  | { type: 'RESET' };

export const initialSession: SessionState = {
  phase: 'landing',
  sessionId: 0,
  inputMode: null,
  recording: null,
  typedText: null,
  paperSeed: 1,
  paperStrokes: 12,
  mode: null,
  permissionError: null,
  notice: null,
  muted: false,
  epoch: 0,
};

/**
 * Allowed transitions. Invalid actions are ignored, which prevents impossible
 * interactions such as destroying a recording while it is still recording.
 */
export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'START_SESSION':
      if (state.phase !== 'landing' && state.phase !== 'completed') return state;
      return {
        ...state,
        phase: 'inputChoice',
        sessionId: state.sessionId + 1,
        inputMode: null,
        recording: null,
        typedText: null,
        notice: null,
        permissionError: null,
      };

    case 'CHOOSE_INPUT':
      if (state.phase !== 'inputChoice') return state;
      return { ...state, inputMode: action.mode, phase: action.mode === 'voice' ? 'recording' : 'typing' };

    case 'SUBMIT_TEXT':
      if (state.phase !== 'typing' || action.text.trim().length === 0) return state;
      return { ...state, phase: 'choosing', typedText: action.text };

    case 'BACK_TO_INPUT_CHOICE':
      if (state.phase !== 'typing') return state;
      return { ...state, phase: 'inputChoice', inputMode: null, typedText: null };

    case 'REQUEST_MIC':
      if (state.phase !== 'permission' && state.phase !== 'recording') return state;
      return { ...state, phase: 'initializing', permissionError: null };

    case 'MIC_READY':
      if (state.phase !== 'initializing') return state;
      return { ...state, phase: 'recording' };

    case 'MIC_FAILED':
      if (state.phase !== 'initializing') return state;
      return { ...state, phase: 'permission', permissionError: action.error };

    case 'RECORDING_STARTED':
      return state;

    case 'FINISH_RECORDING':
      if (state.phase !== 'recording') return state;
      return { ...state, phase: 'review', recording: action.recording };

    case 'DISCARD_RECORDING':
      if (state.phase !== 'review' && state.phase !== 'recording') return state;
      return { ...state, phase: 'recording', recording: null, notice: action.notice ?? null };

    case 'CHOOSE_DESTRUCTION':
      if (state.phase !== 'review' || !state.recording) return state;
      return { ...state, phase: 'choosing' };

    case 'BACK_TO_REVIEW':
      if (state.phase !== 'choosing') return state;
      return { ...state, phase: state.inputMode === 'text' ? 'typing' : 'review' };

    case 'BEGIN_DESTRUCTION':
      if (state.phase !== 'choosing' || (!state.recording && !state.typedText)) return state;
      return {
        ...state,
        phase: action.mode === 'burn' ? 'burning' : 'shredding',
        mode: action.mode,
        paperSeed: action.seed,
        paperStrokes: action.strokes,
        // Recording reference is dropped as soon as destruction starts.
        recording: null,
      };

    case 'DESTRUCTION_DONE':
      if (state.phase !== 'burning' && state.phase !== 'shredding') return state;
      return { ...state, phase: 'cleanup' };

    case 'CLEANUP_DONE':
      if (state.phase !== 'cleanup') return state;
      return { ...state, phase: 'completed', recording: null, typedText: null, mode: null };

    case 'SHOW_COMPLETION':
      if (state.phase !== 'cleanup') return state;
      return { ...state, phase: 'completed', recording: null, typedText: null, mode: null };

    case 'EXIT_SESSION':
      return { ...initialSession, sessionId: state.sessionId, muted: state.muted, epoch: state.epoch + 1 };

    case 'TOGGLE_MUTE':
      return { ...state, muted: !state.muted };

    case 'SET_NOTICE':
      return { ...state, notice: action.notice };

    case 'RESET':
      return { ...initialSession, muted: state.muted, sessionId: state.sessionId, epoch: state.epoch + 1 };

    default:
      return state;
  }
}
