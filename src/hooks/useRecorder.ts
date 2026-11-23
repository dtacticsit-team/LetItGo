import { useCallback, useEffect, useRef, useState } from 'react';
import { startRecorder, type Recorder } from '../engines/audio/recorder';
import type { RecordingData } from '../types';

export type RecordStatus = 'idle' | 'starting' | 'recording' | 'paused' | 'stopping';

interface Options {
  onStarted: () => void;
  onStartError: (err: unknown) => void;
  onFinish: (rec: RecordingData, info: { autoStopped: boolean }) => void;
}

/** Owns the MediaRecorder lifecycle for the recording screen. */
export function useRecorder(opts: Options) {
  const [status, setStatus] = useState<RecordStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<Recorder | null>(null);
  const startingRef = useRef(false);
  const mountedRef = useRef(false);
  const optsRef = useRef(opts);
  const stopRef = useRef<(autoStopped?: boolean) => void>(() => undefined);

  useEffect(() => {
    optsRef.current = opts;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      recRef.current?.abort();
      recRef.current = null;
    };
  }, []);

  const start = useCallback(async () => {
    if (recRef.current || startingRef.current) return;
    startingRef.current = true;
    setError(null);
    setStatus('starting');
    try {
      const rec = await startRecorder({
        onTick: (ms) => setElapsed(ms),
        onAutoStop: () => stopRef.current(true),
        onError: (msg) => {
          recRef.current = null;
          setAnalyser(null);
          setStatus('idle');
          setError(msg);
        },
      });
      startingRef.current = false;
      if (!mountedRef.current) {
        rec.abort();
        return;
      }
      recRef.current = rec;
      setAnalyser(rec.analyser);
      setElapsed(0);
      setStatus('recording');
      optsRef.current.onStarted();
    } catch (err) {
      startingRef.current = false;
      setStatus('idle');
      optsRef.current.onStartError(err);
    }
  }, []);

  const stop = useCallback(async (autoStopped = false) => {
    const rec = recRef.current;
    if (!rec) return;
    setStatus('stopping');
    try {
      const data = await rec.stop();
      recRef.current = null;
      setAnalyser(null);
      setStatus('idle');
      optsRef.current.onFinish(data, { autoStopped });
    } catch {
      recRef.current = null;
      setAnalyser(null);
      setStatus('idle');
      setError('We could not save that recording. Please try again.');
    }
  }, []);

  useEffect(() => {
    stopRef.current = (autoStopped = false) => {
      void stop(autoStopped);
    };
  }, [stop]);

  const pause = useCallback(() => {
    if (!recRef.current) return;
    recRef.current.pause();
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    if (!recRef.current) return;
    recRef.current.resume();
    setStatus('recording');
  }, []);

  const discard = useCallback(() => {
    recRef.current?.abort();
    recRef.current = null;
    setAnalyser(null);
    setElapsed(0);
    setStatus('idle');
  }, []);

  return { status, elapsed, analyser, error, start, pause, resume, stop: () => stop(false), discard };
}
