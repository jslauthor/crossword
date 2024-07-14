import type { Metadata } from 'next';
import { dark } from '@clerk/themes';
import { ClerkProvider } from '@clerk/nextjs';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import './tailwind.css';
import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        elements: {
          formButtonPrimary: 'bg-rose-700 hover:bg-rose-600',
          footerActionLink: 'text-rose-500 hover:text-rose-400',
        },
      }}
    >
      <html lang="en" translate="no" className="notranslate">
        <head>
          <link rel="stylesheet" href="https://use.typekit.net/nhh2njv.css" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="white" />
          <meta name="apple-mobile-web-app-title" content="Crosscube" />
          <link rel="apple-touch-icon" href="general_icon.png" />
          <meta name="google" content="notranslate" />
        </head>
        <body>
          <div vaul-drawer-wrapper="">
            <Providers>{children}</Providers>
            <Analytics />
            <SpeedInsights />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}

const prefix =
  process.env.VERCEL_ENV === 'development' ? 'http://' : 'https://';

export const metadata: Metadata = {
  metadataBase: new URL(`${prefix}${process.env.VERCEL_URL}`),
  title: 'Crosscube',
  description: 'A crossword puzzle in three dimensions',
  openGraph: {
    title: 'Crosscube',
    description: 'A crossword puzzle in three dimensions',
    url: 'https://crosscube.app',
    siteName: 'Crosscube',
    images: [
      {
        url: 'https://crosscube.app/og.png',
        width: 800,
        height: 600,
        alt: 'Crosscube: A crossword puzzle in three dimensions',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    title: 'Crosscube',
    description: 'A crossword puzzle in three dimensions',
    site: 'https://crosscube.app',
    images: [
      {
        url: 'https://crosscube.app/og.png',
        width: 800,
        height: 600,
        alt: 'Crosscube: A crossword puzzle in three dimensions',
      },
    ],
    creator: '@jslauthor',
    card: 'summary',
  },
};

export const dynamic = 'force-dynamic';
