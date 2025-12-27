'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createAudioContext,
  playAudioBuffer,
  reverseAudioBuffer,
  createAnalyser,
} from '@/lib/audio';

export type PlaybackState = 'idle' | 'playing' | 'paused';
export type PlaybackMode = 'original' | 'reversed';

export interface UseAudioPlayerReturn {
  // State
  playbackState: PlaybackState;
  playbackMode: PlaybackMode | null;
  currentTime: number;
  analyser: AnalyserNode | null;

  // Actions
  playOriginal: (buffer: AudioBuffer) => void;
  playReversed: (buffer: AudioBuffer) => void;
  stop: () => void;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const reversedBufferCacheRef = useRef<WeakMap<AudioBuffer, AudioBuffer>>(
    new WeakMap()
  );
  const startTimeRef = useRef<number>(0);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop time tracking
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }

    // Stop current source
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
        sourceRef.current.disconnect();
      } catch {
        // Source might already be stopped
      }
      sourceRef.current = null;
    }

    setAnalyser(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [cleanup]);

  const stop = useCallback(() => {
    cleanup();
    setPlaybackState('idle');
    setPlaybackMode(null);
    setCurrentTime(0);
  }, [cleanup]);

  const play = useCallback(
    async (buffer: AudioBuffer, mode: PlaybackMode) => {
      // Stop any current playback
      cleanup();

      try {
        // Create or reuse audio context
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = createAudioContext();
        }

        // Resume if suspended
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        // Get the buffer to play
        let bufferToPlay = buffer;

        if (mode === 'reversed') {
          // Check cache first
          let reversedBuffer = reversedBufferCacheRef.current.get(buffer);

          if (!reversedBuffer) {
            // Create reversed buffer and cache it
            reversedBuffer = reverseAudioBuffer(audioContextRef.current, buffer);
            reversedBufferCacheRef.current.set(buffer, reversedBuffer);
          }

          bufferToPlay = reversedBuffer;
        }

        // Create analyser for visualization
        const newAnalyser = createAnalyser(audioContextRef.current, 256);
        setAnalyser(newAnalyser);

        // Play the buffer
        const source = playAudioBuffer(
          audioContextRef.current,
          bufferToPlay,
          newAnalyser,
          () => {
            // Playback ended
            setPlaybackState('idle');
            setPlaybackMode(null);
            setCurrentTime(0);
            cleanup();
          }
        );

        sourceRef.current = source;
        setPlaybackState('playing');
        setPlaybackMode(mode);
        setCurrentTime(0);
        startTimeRef.current = audioContextRef.current.currentTime;

        // Start time tracking
        timeIntervalRef.current = setInterval(() => {
          if (audioContextRef.current) {
            const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
            setCurrentTime(elapsed);
          }
        }, 50);
      } catch (error) {
        console.error('Playback error:', error);
        stop();
      }
    },
    [cleanup, stop]
  );

  const playOriginal = useCallback(
    (buffer: AudioBuffer) => {
      play(buffer, 'original');
    },
    [play]
  );

  const playReversed = useCallback(
    (buffer: AudioBuffer) => {
      play(buffer, 'reversed');
    },
    [play]
  );

  return {
    playbackState,
    playbackMode,
    currentTime,
    analyser,
    playOriginal,
    playReversed,
    stop,
  };
}
