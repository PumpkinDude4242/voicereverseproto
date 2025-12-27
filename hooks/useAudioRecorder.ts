'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createAudioContext,
  requestMicrophoneAccess,
  stopMediaStream,
  blobToAudioBuffer,
  createAnalyser,
  getSupportedMimeType,
} from '@/lib/audio';

export type RecordingState = 'idle' | 'requesting' | 'recording' | 'processing';

export interface RecordingData {
  blob: Blob;
  audioBuffer: AudioBuffer;
  duration: number;
}

export interface UseAudioRecorderReturn {
  // State
  state: RecordingState;
  error: string | null;
  recordingData: RecordingData | null;
  duration: number;
  analyser: AnalyserNode | null;

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [recordingData, setRecordingData] = useState<RecordingData | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Refs to hold mutable state that shouldn't trigger re-renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      stopMediaStream(mediaStreamRef.current);
      mediaStreamRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    // Clear chunks
    chunksRef.current = [];

    // Reset analyser
    setAnalyser(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      // Close audio context on unmount
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setState('requesting');

      // Request microphone access
      const stream = await requestMicrophoneAccess();
      mediaStreamRef.current = stream;

      // Create or reuse audio context
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = createAudioContext();
      }

      // Resume if suspended (browser autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Create analyser for visualization
      const newAnalyser = createAnalyser(audioContextRef.current, 256);
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(newAnalyser);
      setAnalyser(newAnalyser);

      // Setup MediaRecorder
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      startTimeRef.current = Date.now();
      setState('recording');
      setDuration(0);

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setDuration(elapsed);
      }, 100);
    } catch (err) {
      cleanup();
      setState('idle');
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, [cleanup]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || state !== 'recording') {
      return;
    }

    setState('processing');

    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    const finalDuration = (Date.now() - startTimeRef.current) / 1000;

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        try {
          // Create blob from chunks
          const blob = new Blob(chunksRef.current, {
            type: mediaRecorder.mimeType,
          });

          // Convert to AudioBuffer
          if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = createAudioContext();
          }

          const audioBuffer = await blobToAudioBuffer(blob, audioContextRef.current);

          setRecordingData({
            blob,
            audioBuffer,
            duration: finalDuration,
          });

          setDuration(finalDuration);
          setState('idle');
          cleanup();
          resolve();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to process recording');
          setState('idle');
          cleanup();
          resolve();
        }
      };

      mediaRecorder.stop();
    });
  }, [state, cleanup]);

  const clearRecording = useCallback(() => {
    setRecordingData(null);
    setDuration(0);
    setError(null);
  }, []);

  return {
    state,
    error,
    recordingData,
    duration,
    analyser,
    startRecording,
    stopRecording,
    clearRecording,
  };
}
