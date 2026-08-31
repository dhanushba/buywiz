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
    ],
  }
}

module.exports = nextConfig
