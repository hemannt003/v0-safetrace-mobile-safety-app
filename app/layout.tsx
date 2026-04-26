import type { Metadata } from 'next';
import { Syne, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const syne = Syne({ 
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['700', '800']
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500']
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '700']
});

export const metadata: Metadata = {
  title: 'SafeTrace',
  description: 'AI-powered women safety system',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-body bg-navy text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
