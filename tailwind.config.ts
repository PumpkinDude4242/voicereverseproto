import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        surface: '#12121a',
        'surface-light': '#1a1a25',
        primary: '#6366f1',
        'primary-hover': '#4f46e5',
        accent: '#22d3ee',
        danger: '#ef4444',
        'danger-hover': '#dc2626',
        success: '#10b981',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'recording': 'recording 1.5s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.6)' },
        },
        recording: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' },
        },
      },
      boxShadow: {
        'neon': '0 0 20px rgba(99, 102, 241, 0.4)',
        'neon-red': '0 0 20px rgba(239, 68, 68, 0.5)',
        'neon-cyan': '0 0 20px rgba(34, 211, 238, 0.4)',
      },
    },
  },
  plugins: [],
};

export default config;
