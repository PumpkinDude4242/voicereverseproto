'use client';

import { useEffect, useState } from 'react';
import { Waves, Github, AlertTriangle } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { RecordButton } from '@/components/RecordButton';
import { PlaybackControls } from '@/components/PlaybackControls';
import { StatusDisplay } from '@/components/StatusDisplay';
import { checkAudioSupport } from '@/lib/audio';

export default function Home() {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [missingApis, setMissingApis] = useState<string[]>([]);

  // Custom hooks for audio handling
  const {
    state: recordingState,
    error,
    recordingData,
    duration,
    analyser: recordingAnalyser,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();

  const {
    playbackState,
    playbackMode,
    currentTime,
    analyser: playbackAnalyser,
    playOriginal,
    playReversed,
    stop: stopPlayback,
  } = useAudioPlayer();

  // Check browser support on mount
  useEffect(() => {
    const { supported, missing } = checkAudioSupport();
    setIsSupported(supported);
    setMissingApis(missing);
  }, []);

  // Determine which analyser to use for visualization
  const isRecording = recordingState === 'recording';
  const isPlaying = playbackState === 'playing';
  const activeAnalyser = isRecording
    ? recordingAnalyser
    : isPlaying
      ? playbackAnalyser
      : null;

  const visualizerMode = isRecording
    ? 'recording'
    : isPlaying
      ? 'playing'
      : 'idle';

  // Handlers
  const handlePlayOriginal = () => {
    if (recordingData?.audioBuffer) {
      playOriginal(recordingData.audioBuffer);
    }
  };

  const handlePlayReversed = () => {
    if (recordingData?.audioBuffer) {
      playReversed(recordingData.audioBuffer);
    }
  };

  const handleClear = () => {
    stopPlayback();
    clearRecording();
  };

  // Browser not supported view
  if (!isSupported) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface rounded-2xl p-8 border border-white/10 text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Browser Not Supported
          </h1>
          <p className="text-gray-400 mb-4">
            Your browser doesn&apos;t support the required audio APIs.
          </p>
          <div className="bg-surface-light rounded-lg p-4 text-left">
            <p className="text-sm text-gray-300 mb-2">Missing APIs:</p>
            <ul className="list-disc list-inside text-sm text-danger">
              {missingApis.map((api) => (
                <li key={api}>{api}</li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Please use a modern browser like Chrome, Firefox, or Edge.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Waves className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Reverse Audio</h1>
              <p className="text-xs text-gray-500">Record & Reverse Your Voice</p>
            </div>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-light transition-colors"
            aria-label="View source on GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Card Container */}
          <div className="bg-surface/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Visualizer Section */}
            <div className="p-6 pb-0">
              <AudioVisualizer
                analyser={activeAnalyser}
                isActive={isRecording || isPlaying}
                mode={visualizerMode}
                className="h-32 sm:h-40"
              />
            </div>

            {/* Controls Section */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Status Display */}
              <div className="flex justify-center">
                <StatusDisplay
                  recordingState={recordingState}
                  playbackState={playbackState}
                  playbackMode={playbackMode}
                  duration={recordingData?.duration ?? duration}
                  currentTime={currentTime}
                  hasRecording={!!recordingData}
                  error={error}
                />
              </div>

              {/* Record Button - Centered */}
              <div className="flex justify-center py-4">
                <RecordButton
                  state={recordingState}
                  onStart={startRecording}
                  onStop={stopRecording}
                  disabled={isPlaying}
                />
              </div>

              {/* Playback Controls */}
              <div className="flex justify-center">
                <PlaybackControls
                  hasRecording={!!recordingData}
                  playbackState={playbackState}
                  playbackMode={playbackMode}
                  isRecording={isRecording}
                  onPlayOriginal={handlePlayOriginal}
                  onPlayReversed={handlePlayReversed}
                  onStop={stopPlayback}
                  onClear={handleClear}
                />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Click the red button to start recording, then play it forward or in reverse.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-xs text-gray-600">
          Built with Next.js, Web Audio API &amp; Tailwind CSS
        </p>
      </footer>
    </main>
  );
}
