import './globals.css';
import './admin.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Khoraghat Premier League (KPL) — Season 3 · 2026',
  description:
    'Khoraghat Premier League (KPL) is Assam’s premier franchise-based hard tennis ball cricket championship. Season 3 kicks off in 2026 at Khoraghat, Bilasipara, Dhubri, Assam. Register your team today.',
  keywords: [
    'Khoraghat Premier League',
    'KPL',
    'hard tennis ball cricket',
    'Bilasipara cricket',
    'Dhubri cricket',
    'Assam cricket tournament',
    'franchise cricket league',
    'Season 3 2026',
  ],
  authors: [{ name: 'Khoraghat Premier League' }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/kpl-logo-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/images/kpl-logo-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'Khoraghat Premier League (KPL) — Season 3 · 2026',
    description: "Assam's premier hard tennis ball cricket championship. Eight franchises. One unforgettable summer. Register your team for KPL Season 3.",
    type: 'website',
    locale: 'en_IN',
    images: [{ url: '/images/kpl-logo.jpg', width: 1200, height: 630, alt: 'Khoraghat Premier League' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Khoraghat Premier League (KPL) — Season 3 · 2026',
    description: "Assam's premier hard tennis ball cricket championship. Register your team for KPL Season 3.",
    images: ['/images/kpl-logo.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,700&family=Barlow:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
