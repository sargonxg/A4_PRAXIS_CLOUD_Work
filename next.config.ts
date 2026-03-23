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
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    turbopackUseSystemTlsCerts: true,
  },
  images: {
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
};

export default nextConfig;
