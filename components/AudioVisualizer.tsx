'use client';

import { useRef, useEffect, useCallback } from 'react';
import { getFrequencyData } from '@/lib/audio';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  mode?: 'recording' | 'playing' | 'idle';
  className?: string;
}

export function AudioVisualizer({
  analyser,
  isActive,
  mode = 'idle',
  className = '',
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Get color based on mode
  const getColor = useCallback(() => {
    switch (mode) {
      case 'recording':
        return {
          primary: 'rgba(239, 68, 68, 0.9)',
          secondary: 'rgba(239, 68, 68, 0.3)',
          glow: 'rgba(239, 68, 68, 0.5)',
        };
      case 'playing':
        return {
          primary: 'rgba(34, 211, 238, 0.9)',
          secondary: 'rgba(34, 211, 238, 0.3)',
          glow: 'rgba(34, 211, 238, 0.5)',
        };
      default:
        return {
          primary: 'rgba(99, 102, 241, 0.6)',
          secondary: 'rgba(99, 102, 241, 0.2)',
          glow: 'rgba(99, 102, 241, 0.3)',
        };
    }
  }, [mode]);

  // Draw idle state (flat line with subtle animation)
  const drawIdle = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const colors = getColor();
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Draw subtle gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.05)');
      gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.1)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.05)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, height / 2 - 2, width, 4);

      // Draw center line
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.strokeStyle = colors.secondary;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw pulsing dot at center
      const time = Date.now() / 1000;
      const pulseSize = 4 + Math.sin(time * 2) * 2;
      ctx.beginPath();
      ctx.arc(width / 2, centerY, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = colors.primary;
      ctx.fill();
    },
    [getColor]
  );

  // Draw frequency visualization
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const colors = getColor();

    ctx.clearRect(0, 0, width, height);

    if (!analyser || !isActive) {
      drawIdle(ctx, width, height);
      animationRef.current = requestAnimationFrame(draw);
      return;
    }

    // Get frequency data
    const dataArray = getFrequencyData(analyser);
    const bufferLength = dataArray.length;

    // Draw bars
    const barCount = Math.min(64, bufferLength);
    const barWidth = (width / barCount) * 0.8;
    const barGap = (width / barCount) * 0.2;
    const centerY = height / 2;

    for (let i = 0; i < barCount; i++) {
      // Sample from the frequency data
      const dataIndex = Math.floor((i / barCount) * bufferLength);
      const value = dataArray[dataIndex] / 255;

      // Calculate bar height with some minimum
      const barHeight = Math.max(2, value * (height / 2 - 10));

      const x = i * (barWidth + barGap) + barGap / 2;

      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(
        x,
        centerY - barHeight,
        x,
        centerY + barHeight
      );
      gradient.addColorStop(0, colors.primary);
      gradient.addColorStop(0.5, colors.secondary);
      gradient.addColorStop(1, colors.primary);

      // Draw bar (mirrored from center)
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, centerY - barHeight, barWidth, barHeight * 2, 2);
      ctx.fill();

      // Add glow effect for active bars
      if (value > 0.5) {
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [analyser, isActive, getColor, drawIdle]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-surface/50 backdrop-blur-sm border border-white/5 ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-primary/30 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-primary/30 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-primary/30 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-primary/30 rounded-br-lg" />
    </div>
  );
}
