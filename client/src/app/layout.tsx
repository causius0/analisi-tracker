import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ReportWebVitals } from '@/lib/web-vitals';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Analisi Tracker - Medical Analytics Platform',
  description: 'Advanced medical lab test analytics with trend analysis, correlation detection, and predictive insights',
  keywords: ['medical analytics', 'lab tests', 'health tracking', 'trend analysis', 'predictive analytics'],
  authors: [{ name: 'Analisi Tracker' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <Providers>
          {children}
          <ReportWebVitals />
        </Providers>
      </body>
    </html>
  );
}
