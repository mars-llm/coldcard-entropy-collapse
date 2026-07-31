import type { Metadata } from 'next';
import { MotionProvider } from '../components/MotionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Entropy Collapse | Cold storage security case study',
  description: 'An independent visual explanation of how a weak random-number fallback affected COLDCARD seed generation on 30 July 2026.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-[100dvh] bg-canvas text-ink selection:bg-accent selection:text-white">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
