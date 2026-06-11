import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

// Old bare paths redirect to /app/* for backward compatibility
const bareRoutes = [
  'dashboard', 'assistant', 'conflict-graph', 'reports', 'media-compass',
  'un-toolkit', 'documents', 'settings', 'calendar', 'advisory',
  'talking-points', 'stakeholder-map', 'early-warning', 'sanctions',
  'scenarios', 'negotiation-prep', 'cases', 'compare', 'argus',
  'concordia', 'dossier', 'treaty-analyzer', 'risk-monitor', 'actors',
  'briefing', 'team', 'situations', 'media-roundup', 'alerts',
  'global-search', 'requirements',
];

const adminTabRedirects = [
  ['diagnostics', 'diagnostics'],
  ['users', 'users'],
  ['domains', 'domains'],
  ['operator-console', 'operator'],
  ['advisors', 'advisors'],
  ['advisor-feed', 'advisor-feed'],
];

const nextConfig: NextConfig = {
  // Cloud Run: standalone output bundles only what's needed for Docker
  output: 'standalone',
  turbopack: {
    root: repoRoot,
  },
  // Server-only packages: do not bundle, load at runtime from node_modules
  // Prevents Node.js built-ins (child_process, fs) from leaking into bundles
  serverExternalPackages: [
    'neo4j-driver',
    'firebase-admin',
    '@google-cloud/firestore',
    'google-auth-library',
    'google-gax',
    '@google-cloud/common',
    'grpc',
    '@grpc/grpc-js',
    // Observability — OTel + Winston GCP transport (native bindings, must not be bundled)
    '@google-cloud/opentelemetry-cloud-trace-exporter',
    '@google-cloud/logging-winston',
    '@opentelemetry/sdk-node',
    '@opentelemetry/auto-instrumentations-node',
    'winston',
    '@grafeo-db/js',
  ],
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
    return [
      ...adminTabRedirects.map(([route, tab]) => ({
        source: `/app/admin/${route}`,
        destination: `/app/admin?tab=${tab}`,
        permanent: true,
      })),
      ...bareRoutes.map((route) => ({
        source: `/${route}/:path*`,
        destination: `/app/${route}/:path*`,
        permanent: false,
      })),
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
