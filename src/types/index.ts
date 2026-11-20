export type Phase =
  | 'landing'
  | 'inputChoice'
  | 'initializing'
  | 'permission'
  | 'recording'
  | 'typing'
  | 'review'
  | 'choosing'
  | 'burning'
  | 'shredding'
  | 'cleanup'
  | 'completed';

export type InputMode = 'voice' | 'text';

export type DestructionMode = 'burn' | 'shred';

export interface RecordingData {
  blob: Blob;
  durationMs: number;
  mimeType: string;
}

export interface PermissionError {
  title: string;
  message: string;
  canRetry: boolean;
}
