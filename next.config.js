/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' to enable SSR
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig