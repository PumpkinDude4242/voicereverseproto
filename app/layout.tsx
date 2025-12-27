import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Reverse Audio - Record & Reverse Your Voice',
  description:
    'A modern web application to record your voice and play it in reverse. Built with Web Audio API.',
  keywords: ['audio', 'reverse', 'voice recorder', 'web audio api'],
  authors: [{ name: 'Reverse Audio App' }],
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="bg-gradient-animated min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
