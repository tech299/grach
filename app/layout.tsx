import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FullMarks',
  description: 'AI-powered assignment optimizer with tracked rubric-based improvements.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
