import type { AppProps } from 'next/app';
import GlobalStyles from '../components/GlobalStyles';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Apply theme here
    document.documentElement.className = 'dark';
  });

  return (
    <div className="dark">
      <GlobalStyles />
      <Component {...pageProps} />
    </div>
  );
}
