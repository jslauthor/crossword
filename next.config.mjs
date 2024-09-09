// @ts-check
import withSerwistInit from '@serwist/next';

// const withLitSSR = require('@lit-labs/nextjs')(); // this support web component ssr
// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: process.env.ANALYZE === 'true',
// });

const withSerwist = withSerwistInit({
  // Note: This is only an example. If you use Pages Router,
  // use something else that works, such as "service-worker/index.ts".
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  compiler: {
    styledComponents: {
      ssr: true,
    },
  },
};

// module.exports = withLitSSR(nextConfig);
// module.exports = withBundleAnalyzer(nextConfig);
export default withSerwist(nextConfig);
