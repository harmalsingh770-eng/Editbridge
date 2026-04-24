/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensures all pages render correctly on Vercel
  // localStorage is only accessed client-side (guarded in db.js)
}

module.exports = nextConfig
