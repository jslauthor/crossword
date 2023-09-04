import type { Metadata } from 'next';
import GlobalStyles from '../components/GlobalStyles';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/nhh2njv.css" />
      </head>
      <body className="dark">
        <GlobalStyles />
        {children}
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_URL ?? ''),
  title: 'Crosscube',
  description: 'An 8x8 crossword in three dimensions',
  openGraph: {
    title: 'Crosscube',
    description: 'An 8x8 crossword in three dimensions',
    url: 'https://crosscube.app',
    siteName: 'Crosscube',
    images: [
      {
        url: 'https://crosscube.app/og.png',
        width: 800,
        height: 600,
      },
      {
        url: 'https://crosscube.app/og-alt.png',
        width: 1800,
        height: 1600,
        alt: 'Crosscube: An 8x8 crossword in three dimensions',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};
