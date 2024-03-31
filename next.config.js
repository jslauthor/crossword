// const withLitSSR = require('@lit-labs/nextjs')(); // this support web component ssr

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  transpilePackages: ['three'],
  compiler: {
    styledComponents: {
      ssr: true,
    },
  },
  webpack: (config) => {
    config.resolve.alias.yjs = path.resolve('node_modules/yjs/dist/yjs.mjs');
    return config;
  },
};

// module.exports = withLitSSR(nextConfig);
module.exports = nextConfig;
