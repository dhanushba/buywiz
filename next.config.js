/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['mongoose'],
  images: {
    remotePatterns: [
      {
        hostname: "*.amazon.*",
        protocol: "https",
      },
      {
        hostname: "*.flipkart.com",
        protocol: "https",
      },
      {
        hostname: "*.croma.com",
        protocol: "https",
      },
      {
        hostname: "*.reliancedigital.in",
        protocol: "https",
      },
      {
        hostname: "*.gstatic.com",
        protocol: "https",
      },
      {
        hostname: "*.googleapis.com",
        protocol: "https",
      },
      {
        hostname: "*.google.com",
        protocol: "https",
      },
      {
        hostname: "lh3.googleusercontent.com",
        protocol: "https",
      },
    ],
  }
}

module.exports = nextConfig
