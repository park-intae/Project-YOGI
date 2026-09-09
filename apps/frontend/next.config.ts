import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.BACKEND_INTERNAL_URL 
          ? "${process.env.BACKEND_INTERNAL_URL}/:path*" 
          : 'http://localhost:3002/api/:path*',
      },
    ];
  },
};

export default nextConfig;
