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
          <link rel="apple-touch-icon" href="general_icon@512.png" />
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

const prefix =
  process.env.VERCEL_ENV === 'development' ? 'http://' : 'https://';

const APP_NAME = 'Crosscube';
const APP_DEFAULT_TITLE = 'Crosscube';
const APP_TITLE_TEMPLATE = '%s: 3D Crossword Puzzles';
const APP_DESCRIPTION = 'Crossword puzzles in three dimensions!';

export const metadata: Metadata = {
  metadataBase: new URL(`${prefix}${process.env.VERCEL_URL}`),
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_DEFAULT_TITLE,
    startupImage: ['/general_icon@512.png'],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    url: 'https://crosscube.app',
    siteName: APP_NAME,
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
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
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
