const withLitSSR = require('@lit-labs/nextjs')(); // this support web component ssr

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['three'],
}

module.exports = withLitSSR(nextConfig);
