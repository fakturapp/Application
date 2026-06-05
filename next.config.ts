import type { NextConfig } from 'next'

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
  },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    preloadEntriesOnStart: false,
    webpackMemoryOptimizations: true,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  async rewrites() {
    return [
      { source: '/avatars/:path*', destination: `${backendUrl}/avatars/:path*` },
      { source: '/company-logos/:path*', destination: `${backendUrl}/company-logos/:path*` },
      { source: '/team-icons/:path*', destination: `${backendUrl}/team-icons/:path*` },
      { source: '/invoice-logos/:path*', destination: `${backendUrl}/invoice-logos/:path*` },
    ]
  },
}

export default nextConfig
