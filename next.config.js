/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    cpus: 1,
  },
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;
