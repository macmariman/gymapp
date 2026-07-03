import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Space_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { Header } from '@/components/layout/Header';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk'
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono'
});

export const metadata: Metadata = {
  title: {
    default: 'Gym App',
    template: '%s | Gym App'
  },
  applicationName: 'Gym App',
  description: 'Rutina de gimnasio con asistencia, pesos por serie e historial.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gym App'
  },
  openGraph: {
    title: 'Gym App',
    description: 'Rutina de gimnasio con asistencia, pesos por serie e historial.',
    type: 'website'
  },
  twitter: {
    card: 'summary',
    title: 'Gym App',
    description: 'Rutina de gimnasio con asistencia, pesos por serie e historial.'
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfbf9' },
    { media: '(prefers-color-scheme: dark)', color: '#16181f' }
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <div className="min-h-screen bg-background">
              <Header />
              <main className="mx-auto w-full max-w-xl px-4 py-4 pb-28">
                {children}
              </main>
            </div>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
