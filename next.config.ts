import type { NextConfig } from "next";

// Old bare paths redirect to /app/* for backward compatibility
const bareRoutes = [
  'dashboard', 'assistant', 'conflict-graph', 'reports', 'media-compass',
  'un-toolkit', 'documents', 'settings', 'calendar', 'advisory',
  'talking-points', 'stakeholder-map', 'early-warning', 'sanctions',
  'scenarios', 'negotiation-prep', 'cases', 'compare', 'argus',
  'concordia', 'dossier', 'treaty-analyzer', 'risk-monitor', 'actors',
  'briefing', 'team', 'situations', 'media-roundup', 'alerts',
];

const nextConfig: NextConfig = {
  // Cloud Run: standalone output bundles only what's needed for Docker
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    // Cloud Run doesn't have Vercel's image optimizer
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return bareRoutes.map((route) => ({
      source: `/${route}/:path*`,
      destination: `/app/${route}/:path*`,
      permanent: false,
    }));
  },

  async rewrites() {
    return [
      // Proxy /backend/* to the Python Cloud Run backend for local dev
      {
        source: '/backend/:path*',
        destination: `${process.env.NEXT_PUBLIC_PRAXIS_BACKEND_URL || 'http://localhost:8080'}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
