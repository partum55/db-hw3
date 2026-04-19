import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import NavBar from '@/components/NavBar';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MedLab DBS — Medical Laboratory Database System',
  description: 'Medical laboratory database management for a private diagnostic clinic',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NavBar />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
          {children}
        </main>
        <footer
          className="text-center py-3 text-xs"
          style={{
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border)',
            fontFamily: 'var(--font-geist-mono)',
          }}
        >
          MEDLAB DBS · medical_test_v07 · PRIVATE DIAGNOSTIC CLINIC
        </footer>
      </body>
    </html>
  );
}
