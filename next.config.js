// const withLitSSR = require('@lit-labs/nextjs')(); // this support web component ssr

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['three'],
  compiler: {
    styledComponents: {
      ssr: true,
    },
  }
}

// module.exports = withLitSSR(nextConfig);
module.exports = nextConfig;
