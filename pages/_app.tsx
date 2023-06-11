import type { AppProps } from 'next/app';

import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Apply theme here
    document.documentElement.className = 'dark';
  });

  return (
    <div className="dark">
      <Component {...pageProps} />
    </div>
  );
}
