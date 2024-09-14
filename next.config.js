// const withLitSSR = require('@lit-labs/nextjs')(); // this support web component ssr
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, follow',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Redirect root of crossmoji.app to crosscube.app/crosscube/latest/moji
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: 'crossmoji.app',
          },
        ],
        destination: 'https://crosscube.app/crosscube/latest/moji',
        permanent: true,
      },
      // Redirect all other paths of crossmoji.app to the same path on crosscube.app
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'crossmoji.app',
          },
        ],
        destination: 'https://crosscube.app/:path*',
        permanent: true,
      },
      // Handle subdomains of crossmoji.app
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: '(?<subdomain>.+).crossmoji.app',
          },
        ],
        destination: 'https://:subdomain.crosscube.app/:path*',
        permanent: true,
      },
      // Redirect root of subdomains to /crosscube/latest/moji
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: '(?<subdomain>.+).crossmoji.app',
          },
        ],
        destination: 'https://:subdomain.crosscube.app/crosscube/latest/moji',
        permanent: true,
      },
    ];
  },
};

// module.exports = withLitSSR(nextConfig);
module.exports = withBundleAnalyzer(nextConfig);
