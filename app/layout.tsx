import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import { Providers } from './providers'
import { Bebas_Neue, Noto_Sans, JetBrains_Mono } from 'next/font/google'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Mundial 2026 Predictor',
    template: '%s | Mundial 2026 Predictor',
  },
  description: 'Predice el campeón del FIFA World Cup 2026. Compite con amigos en tu sala privada.',
  keywords: ['mundial 2026', 'world cup 2026', 'predictor', 'apuestas deportivas', 'FIFA'],
  openGraph: {
    title: 'Mundial 2026 Predictor',
    description: 'Predice los resultados del FIFA World Cup 2026',
    type: 'website',
    locale: 'es_MX',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#2A398D',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning className={`${bebasNeue.variable} ${notoSans.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: 'Noto Sans, sans-serif',
                borderRadius: '12px',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
