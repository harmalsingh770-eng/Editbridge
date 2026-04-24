/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Optional but useful for Vercel stability
  env: {
    APP_NAME: "EditBridge",
  },
};

module.exports = nextConfig;