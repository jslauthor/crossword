// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';
import GlobalStyles from '../components/GlobalStyles';

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="stylesheet" href="https://use.typekit.net/nhh2njv.css" />
      </Head>
      <body>
        <GlobalStyles />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
