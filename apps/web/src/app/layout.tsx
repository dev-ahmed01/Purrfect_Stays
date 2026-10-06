import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import { AuthProvider } from '../auth/auth-provider';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Purrfect Stays',
    template: '%s | Purrfect Stays',
  },
  description: 'Pet-friendly stays across India, matched to the pets travelling with you.',
  applicationName: 'Purrfect Stays',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${playfair.variable}`}>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
