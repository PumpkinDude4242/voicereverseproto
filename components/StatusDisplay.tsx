'use client';

import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { formatDuration } from '@/lib/audio';
import type { RecordingState } from '@/hooks/useAudioRecorder';
import type { PlaybackState, PlaybackMode } from '@/hooks/useAudioPlayer';

interface StatusDisplayProps {
  recordingState: RecordingState;
  playbackState: PlaybackState;
  playbackMode: PlaybackMode | null;
  duration: number;
  currentTime: number;
  hasRecording: boolean;
  error: string | null;
}

export function StatusDisplay({
  recordingState,
  playbackState,
  playbackMode,
  duration,
  currentTime,
  hasRecording,
  error,
}: StatusDisplayProps) {
  const isRecording = recordingState === 'recording';
  const isPlaying = playbackState === 'playing';

  // Determine status message and style
  let message = 'Ready to record';
  let icon = <Clock className="w-4 h-4" />;
  let statusClass = 'text-gray-400';

  if (error) {
    message = error;
    icon = <AlertCircle className="w-4 h-4" />;
    statusClass = 'text-danger';
  } else if (recordingState === 'requesting') {
    message = 'Requesting microphone access...';
    statusClass = 'text-yellow-400';
  } else if (recordingState === 'processing') {
    message = 'Processing recording...';
    statusClass = 'text-yellow-400';
  } else if (isRecording) {
    message = `Recording: ${formatDuration(duration)}`;
    icon = <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />;
    statusClass = 'text-danger';
  } else if (isPlaying) {
    const modeLabel = playbackMode === 'reversed' ? 'Reversed' : 'Original';
    message = `Playing ${modeLabel}: ${formatDuration(currentTime)} / ${formatDuration(duration)}`;
    icon = <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />;
    statusClass = 'text-accent';
  } else if (hasRecording) {
    message = `Recording saved: ${formatDuration(duration)}`;
    icon = <CheckCircle2 className="w-4 h-4" />;
    statusClass = 'text-success';
  }

  return (
    <div
      className={`
        flex items-center justify-center gap-2
        px-4 py-2 rounded-lg
        bg-surface/50 backdrop-blur-sm
        border border-white/5
        transition-colors duration-300
        ${statusClass}
      `}
    >
      {icon}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
