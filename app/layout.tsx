import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { Header } from '@/components/layout/Header';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

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
    { media: '(prefers-color-scheme: light)', color: '#f7f8f5' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <div className="min-h-screen bg-[linear-gradient(180deg,#f7f8f5_0%,#eef2ec_35%,#e5ece6_100%)] dark:bg-[linear-gradient(180deg,#0f172a_0%,#111827_45%,#172033_100%)]">
              <Header />
              {children}
            </div>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
