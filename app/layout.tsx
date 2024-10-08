import type { Metadata } from 'next';
import { dark } from '@clerk/themes';
import { ClerkProvider } from '@clerk/nextjs';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import './tailwind.css';
import { Providers } from './providers';
import { headers } from 'next/headers';
import { UserConfigState } from 'lib/stores/user-config';
import { HEADER_X_USER_SUBSCRIBED } from 'middleware';
import { Toaster } from 'components/core/ui/toaster';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let defaultConfig: UserConfigState = {
    isSubscribed: false,
    showSettings: false,
  };

  const headersList = headers();
  const isSubscribed = headersList.get(HEADER_X_USER_SUBSCRIBED);
  if (isSubscribed != null) {
    defaultConfig.isSubscribed = Boolean(parseInt(isSubscribed, 10));
  }

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
            <Providers userConfig={defaultConfig}>{children}</Providers>
            <Analytics />
            <SpeedInsights />
          </div>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';
  const host = headersList.get('x-host') || process.env.VERCEL_URL;
  const canonicalUrl = `https://${host}${pathname}`;

  return {
    metadataBase: new URL(`https://${host}`),
    title: 'Crosscube',
    description: 'A crossword puzzle in three dimensions',
    alternates: {
      canonical: canonicalUrl,
    },
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
}

export const dynamic = 'force-dynamic';
