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
};

// module.exports = withLitSSR(nextConfig);
module.exports = withBundleAnalyzer(nextConfig);
