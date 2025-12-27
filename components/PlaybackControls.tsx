'use client';

import { Play, RotateCcw, Square, Trash2 } from 'lucide-react';
import type { PlaybackState, PlaybackMode } from '@/hooks/useAudioPlayer';

interface PlaybackControlsProps {
  hasRecording: boolean;
  playbackState: PlaybackState;
  playbackMode: PlaybackMode | null;
  isRecording: boolean;
  onPlayOriginal: () => void;
  onPlayReversed: () => void;
  onStop: () => void;
  onClear: () => void;
}

export function PlaybackControls({
  hasRecording,
  playbackState,
  playbackMode,
  isRecording,
  onPlayOriginal,
  onPlayReversed,
  onStop,
  onClear,
}: PlaybackControlsProps) {
  const isPlaying = playbackState === 'playing';
  const isDisabled = !hasRecording || isRecording;

  const buttonBaseClass = `
    relative flex items-center gap-2 px-6 py-3
    rounded-xl font-medium text-sm
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background
    disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
  `;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      {/* Play Original Button */}
      <button
        onClick={isPlaying && playbackMode === 'original' ? onStop : onPlayOriginal}
        disabled={isDisabled}
        className={`
          ${buttonBaseClass}
          ${
            isPlaying && playbackMode === 'original'
              ? 'bg-accent text-background shadow-neon-cyan'
              : 'bg-surface-light hover:bg-primary/20 text-white hover:shadow-neon border border-white/10 hover:border-primary/30'
          }
          focus:ring-primary
          ${!isDisabled ? 'hover:scale-[1.02] active:scale-[0.98]' : ''}
        `}
        aria-label={
          isPlaying && playbackMode === 'original'
            ? 'Stop playback'
            : 'Play original recording'
        }
      >
        {isPlaying && playbackMode === 'original' ? (
          <>
            <Square className="w-4 h-4 fill-current" />
            <span>Stop</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" />
            <span>Play Original</span>
          </>
        )}
      </button>

      {/* Play Reversed Button */}
      <button
        onClick={isPlaying && playbackMode === 'reversed' ? onStop : onPlayReversed}
        disabled={isDisabled}
        className={`
          ${buttonBaseClass}
          ${
            isPlaying && playbackMode === 'reversed'
              ? 'bg-accent text-background shadow-neon-cyan'
              : 'bg-surface-light hover:bg-primary/20 text-white hover:shadow-neon border border-white/10 hover:border-primary/30'
          }
          focus:ring-primary
          ${!isDisabled ? 'hover:scale-[1.02] active:scale-[0.98]' : ''}
        `}
        aria-label={
          isPlaying && playbackMode === 'reversed'
            ? 'Stop playback'
            : 'Play reversed recording'
        }
      >
        {isPlaying && playbackMode === 'reversed' ? (
          <>
            <Square className="w-4 h-4 fill-current" />
            <span>Stop</span>
          </>
        ) : (
          <>
            <RotateCcw className="w-4 h-4" />
            <span>Play Reversed</span>
          </>
        )}
      </button>

      {/* Clear Button */}
      <button
        onClick={onClear}
        disabled={isDisabled || isPlaying}
        className={`
          ${buttonBaseClass}
          bg-transparent hover:bg-danger/10 text-gray-400 hover:text-danger
          border border-white/5 hover:border-danger/30
          focus:ring-danger
          ${!isDisabled && !isPlaying ? 'hover:scale-[1.02] active:scale-[0.98]' : ''}
        `}
        aria-label="Clear recording"
      >
        <Trash2 className="w-4 h-4" />
        <span className="sr-only sm:not-sr-only">Clear</span>
      </button>
    </div>
  );
}
