import type { Metadata } from 'next';
import { MotionProvider } from '../components/MotionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Entropy Collapse | The COLDCARD seed-generation failure explained',
  description: 'A clear visual explanation of how affected COLDCARD firmware weakened seed generation, what owners should do, and what the published estimates mean.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-[100dvh] bg-canvas text-ink selection:bg-accent selection:text-canvas">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
