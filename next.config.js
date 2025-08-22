/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Do not fail production builds on ESLint warnings/errors
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
