import type { AppProps } from 'next/app';
import Head from 'next/head';
import GlobalStyles from '../components/GlobalStyles';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Apply theme here
    document.documentElement.className = 'dark';
  });

  return (
    <div className="dark">
      <Head>
        <link rel="stylesheet" href="https://use.typekit.net/nhh2njv.css" />
      </Head>
      <GlobalStyles />
      <Component {...pageProps} />
    </div>
  );
}
