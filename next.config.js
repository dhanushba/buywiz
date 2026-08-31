/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['mongoose'],
  images: {
    remotePatterns: [
      // Shopping sites
      { hostname: "*.amazon.*", protocol: "https" },
      { hostname: "*.flipkart.com", protocol: "https" },
      { hostname: "*.croma.com", protocol: "https" },
      { hostname: "*.reliancedigital.in", protocol: "https" },
      // Google CDNs
      { hostname: "*.gstatic.com", protocol: "https" },
      { hostname: "*.googleapis.com", protocol: "https" },
      { hostname: "lh3.googleusercontent.com", protocol: "https" },
      // Allow all search engine and CDN images
      { hostname: "*.google.*", protocol: "https" },
      { hostname: "*.bing.com", protocol: "https" },
      { hostname: "*.ebay-us.com", protocol: "https" },
      { hostname: "*.ebay.com", protocol: "https" },
      // Generic wildcard for common CDNs
      { hostname: "*.cloudfront.net", protocol: "https" },
      { hostname: "*.akamaized.net", protocol: "https" },
    ],
  }
}

module.exports = nextConfig
