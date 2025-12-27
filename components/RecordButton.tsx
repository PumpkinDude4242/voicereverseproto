'use client';

import { Mic, Square, Loader2 } from 'lucide-react';
import type { RecordingState } from '@/hooks/useAudioRecorder';

interface RecordButtonProps {
  state: RecordingState;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function RecordButton({
  state,
  onStart,
  onStop,
  disabled = false,
}: RecordButtonProps) {
  const isRecording = state === 'recording';
  const isRequesting = state === 'requesting';
  const isProcessing = state === 'processing';
  const isLoading = isRequesting || isProcessing;

  const handleClick = () => {
    if (isLoading || disabled) return;

    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`
        relative group
        w-20 h-20 rounded-full
        flex items-center justify-center
        transition-all duration-300 ease-out
        focus:outline-none focus:ring-4 focus:ring-danger/30
        disabled:opacity-50 disabled:cursor-not-allowed
        ${
          isRecording
            ? 'bg-danger hover:bg-danger-hover shadow-neon-red animate-recording'
            : 'bg-danger/80 hover:bg-danger hover:shadow-neon-red hover:scale-105'
        }
      `}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {/* Outer ring animation for recording */}
      {isRecording && (
        <>
          <span className="absolute inset-0 rounded-full bg-danger/30 animate-ping" />
          <span className="absolute inset-[-4px] rounded-full border-2 border-danger/50 animate-pulse" />
        </>
      )}

      {/* Icon */}
      <span className="relative z-10">
        {isLoading ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : isRecording ? (
          <Square className="w-7 h-7 text-white fill-white" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}
      </span>
    </button>
  );
}
