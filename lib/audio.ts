/**
 * Audio utility functions for the Reverse Audio application.
 * Handles audio context management, buffer manipulation, and playback.
 */

// Type definitions for Web Audio API extensions
export interface AudioContextState {
  context: AudioContext | null;
  analyser: AnalyserNode | null;
  source: AudioBufferSourceNode | null;
}

export interface RecordingResult {
  blob: Blob;
  audioBuffer: AudioBuffer;
}

/**
 * Creates a new AudioContext with cross-browser support.
 * Handles the webkit prefix for older browsers.
 */
export function createAudioContext(): AudioContext {
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error('Web Audio API is not supported in this browser');
  }

  return new AudioContextClass();
}

/**
 * Requests microphone permission and returns a MediaStream.
 * Handles permission errors with meaningful messages.
 */
export async function requestMicrophoneAccess(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    return stream;
  } catch (error) {
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
          throw new Error(
            'Microphone access denied. Please allow microphone access to record audio.'
          );
        case 'NotFoundError':
          throw new Error(
            'No microphone found. Please connect a microphone and try again.'
          );
        case 'NotReadableError':
          throw new Error(
            'Microphone is already in use by another application.'
          );
        default:
          throw new Error(`Microphone error: ${error.message}`);
      }
    }
    throw error;
  }
}

/**
 * Stops all tracks in a MediaStream to release the microphone.
 */
export function stopMediaStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

/**
 * Converts a Blob to an AudioBuffer using the provided AudioContext.
 */
export async function blobToAudioBuffer(
  blob: Blob,
  audioContext: AudioContext
): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
}

/**
 * Reverses an AudioBuffer by creating a new buffer with reversed channel data.
 * This directly manipulates the PCM data for instant reversal.
 */
export function reverseAudioBuffer(
  audioContext: AudioContext,
  sourceBuffer: AudioBuffer
): AudioBuffer {
  const numberOfChannels = sourceBuffer.numberOfChannels;
  const length = sourceBuffer.length;
  const sampleRate = sourceBuffer.sampleRate;

  // Create a new buffer with the same properties
  const reversedBuffer = audioContext.createBuffer(
    numberOfChannels,
    length,
    sampleRate
  );

  // Reverse each channel's data
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const sourceData = sourceBuffer.getChannelData(channel);
    const reversedData = reversedBuffer.getChannelData(channel);

    // Copy data in reverse order
    for (let i = 0; i < length; i++) {
      reversedData[i] = sourceData[length - 1 - i];
    }
  }

  return reversedBuffer;
}

/**
 * Creates and connects an AnalyserNode for audio visualization.
 */
export function createAnalyser(
  audioContext: AudioContext,
  fftSize: number = 2048
): AnalyserNode {
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = 0.8;
  return analyser;
}

/**
 * Plays an AudioBuffer through the provided AudioContext.
 * Returns the source node for stopping/controlling playback.
 */
export function playAudioBuffer(
  audioContext: AudioContext,
  buffer: AudioBuffer,
  analyser?: AnalyserNode,
  onEnded?: () => void
): AudioBufferSourceNode {
  const source = audioContext.createBufferSource();
  source.buffer = buffer;

  if (analyser) {
    source.connect(analyser);
    analyser.connect(audioContext.destination);
  } else {
    source.connect(audioContext.destination);
  }

  if (onEnded) {
    source.onended = onEnded;
  }

  source.start(0);
  return source;
}

/**
 * Gets the frequency data from an AnalyserNode for visualization.
 */
export function getFrequencyData(analyser: AnalyserNode): Uint8Array {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);
  return dataArray;
}

/**
 * Gets the time domain data from an AnalyserNode for waveform visualization.
 */
export function getTimeDomainData(analyser: AnalyserNode): Uint8Array {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);
  return dataArray;
}

/**
 * Formats duration in seconds to MM:SS format.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Checks if the browser supports the required audio APIs.
 */
export function checkAudioSupport(): {
  supported: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!window.AudioContext && !(window as unknown as { webkitAudioContext: unknown }).webkitAudioContext) {
    missing.push('AudioContext');
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    missing.push('getUserMedia');
  }

  if (!window.MediaRecorder) {
    missing.push('MediaRecorder');
  }

  return {
    supported: missing.length === 0,
    missing,
  };
}

/**
 * Gets supported MIME types for MediaRecorder.
 */
export function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
    'audio/wav',
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return 'audio/webm'; // Fallback
}
