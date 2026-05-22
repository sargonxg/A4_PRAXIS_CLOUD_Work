export type LegalPageSlug =
  | 'privacy'
  | 'cookies'
  | 'gdpr'
  | 'data-processing'
  | 'terms'
  | 'security'
  | 'sub-processors'
  | 'data-retention';

export interface LegalPageSection {
  heading: string;
  body: string[];
}

export interface LegalPage {
  slug: LegalPageSlug;
  title: string;
  summary: string;
  updatedAt: string;
  pendingLegalReview: boolean;
  sections: LegalPageSection[];
}

export const legalPages: LegalPage[] = [
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    summary: 'How PRAXIS collects, stores, uses, and protects account, workspace, source, document, and product telemetry data.',
    updatedAt: '2026-05-19',
    pendingLegalReview: true,
    sections: [
      {
        heading: 'Data We Collect',
        body: [
          'PRAXIS stores account identifiers, authentication metadata, analyst profile choices, workspace configuration, ContextCapsules, user documents, source receipts, conversations, generated outputs, and operational telemetry needed to run the service.',
          'Uploaded documents and source material remain user workspace data. PRAXIS stores metadata, short excerpts, retrieval receipts, and generated analysis required to provide the product.',
        ],
      },
      {
        heading: 'How We Use Data',
        body: [
          'We use workspace data to authenticate users, build context for AI-assisted analysis, persist output capsules, maintain audit trails, debug reliability issues, and protect the service from abuse.',
          'We do not sell user data. External model and infrastructure providers are limited to the sub-processors listed in the public sub-processor page.',
        ],
      },
      {
        heading: 'User Control',
        body: [
          'Authenticated users can export or delete account data through the product-supported routes where available. Deletion requests are handled as account deletion and workspace erasure workflows.',
          'Security or privacy requests can be sent to security@tacitus.me.',
        ],
      },
    ],
  },
  {
    slug: 'cookies',
    title: 'Cookie Notice',
    summary: 'How PRAXIS uses essential cookies, authentication storage, analytics settings, and future consent controls.',
    updatedAt: '2026-05-22',
    pendingLegalReview: true,
    sections: [
      {
        heading: 'Essential Cookies',
        body: [
          'PRAXIS uses essential cookies and browser storage to keep users signed in, protect sessions, remember interface state, and route authenticated requests safely.',
          'Essential cookies are required for the service and are not used to sell personal information or build third-party advertising profiles.',
        ],
      },
      {
        heading: 'Analytics and Product Telemetry',
        body: [
          'PRAXIS may collect privacy-conscious product telemetry to understand reliability, page performance, feature adoption, and abuse patterns.',
          'Where non-essential analytics are introduced, PRAXIS will maintain appropriate consent and opt-out controls for users and regions that require them.',
        ],
      },
      {
        heading: 'Managing Cookies',
        body: [
          'Users can manage cookies through browser settings. Blocking essential cookies may prevent sign-in, workspace access, or secure product flows from working correctly.',
        ],
      },
    ],
  },
  {
    slug: 'gdpr',
    title: 'GDPR and Privacy Rights',
    summary: 'Current GDPR-style rights posture for access, correction, export, deletion, objection, restriction, and support requests.',
    updatedAt: '2026-05-22',
    pendingLegalReview: true,
    sections: [
      {
        heading: 'Rights Requests',
        body: [
          'Where GDPR or similar privacy law applies, users may request access, correction, export, deletion, restriction, objection, or portability for personal data processed by PRAXIS.',
          'Requests can be sent to security@tacitus.me. PRAXIS may need to verify account ownership before acting on a request.',
        ],
      },
      {
        heading: 'Workspace and Generated Data',
        body: [
          'ContextCapsules, uploaded documents, source receipts, conversations, generated outputs, and audit trails may contain user-provided or user-derived personal data.',
          'Deletion and export workflows are handled at the account or workspace level where supported, subject to legal, security, billing, abuse-prevention, and backup-integrity exceptions.',
        ],
      },
      {
        heading: 'International Processing',
        body: [
          'The current production baseline uses United States infrastructure unless a separate enterprise arrangement states otherwise.',
          'EU residency, transfer-impact review, and expanded DPA support remain tracked launch-readiness items for regulated deployments.',
        ],
      },
    ],
  },
  {
    slug: 'data-processing',
    title: 'Data Processing Addendum',
    summary: 'Customer-data processing roles, instructions, sub-processors, security controls, retention, deletion, and support channels.',
    updatedAt: '2026-05-22',
    pendingLegalReview: true,
    sections: [
      {
        heading: 'Processing Roles',
        body: [
          'For customer workspace data, PRAXIS generally acts as a processor or service provider acting on user instructions, while the customer remains responsible for lawful input data and review of outputs.',
          'For account administration, security, billing, abuse prevention, and service operations, PRAXIS may act as an independent controller where applicable law recognizes that role.',
        ],
      },
      {
        heading: 'Processing Instructions',
        body: [
          'PRAXIS processes customer data to provide authenticated workspaces, ContextCapsules, document handling, retrieval, AI-assisted analysis, output generation, receipts, reliability monitoring, and support.',
          'AI model and infrastructure sub-processors are limited to the public sub-processor list and operational providers needed to run the service.',
        ],
      },
      {
        heading: 'Security, Retention, and Deletion',
        body: [
          'PRAXIS applies server-side secret handling, role-based service access, encrypted provider-key storage, production security headers, audit receipts, and reliability controls as part of its baseline.',
          'Retention and deletion follow the public data-retention page, subject to security, legal, billing, abuse-prevention, and backup-integrity obligations.',
        ],
      },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of Service',
    summary: 'Operational terms for using PRAXIS as a beta policy and statecraft workbench.',
    updatedAt: '2026-05-19',
    pendingLegalReview: true,
    sections: [
      {
        heading: 'Beta Service',
        body: [
          'PRAXIS is currently a beta software service. Features, limits, pricing, integrations, and data-processing behavior may change as the product matures.',
          'Users are responsible for reviewing generated outputs before relying on them in policy, legal, diplomatic, humanitarian, security, or institutional decisions.',
        ],
      },
      {
        heading: 'Acceptable Use',
        body: [
          'Do not use PRAXIS to violate law, bypass access controls, upload material you are not permitted to process, attack third-party systems, or generate harmful instructions.',
          'Do not attempt to extract secrets, credentials, system prompts, private workspace data, or data belonging to another user or organization.',
        ],
      },
      {
        heading: 'No Professional Advice',
        body: [
          'PRAXIS may help organize legal, policy, diplomatic, or operational analysis, but generated content is not legal, financial, security, or professional advice.',
          'Human review is required before publication, operational action, or external sharing.',
        ],
      },
    ],
  },
  {
    slug: 'security',
    title: 'Security',
    summary: 'Security posture, reporting channel, and launch-readiness baseline for PRAXIS.',
    updatedAt: '2026-05-19',
    pendingLegalReview: false,
    sections: [
      {
        heading: 'Security Baseline',
        body: [
          'PRAXIS keeps provider keys, Firebase Admin credentials, cookie-signing secrets, user-key master secrets, and billing secrets server-side only.',
          'The production boundary is Next.js on Cloud Run, private backend services, Firebase Auth, Firestore and Storage rules, Cloud SQL for runtime ledgers, Secret Manager, and service-to-service OIDC.',
        ],
      },
      {
        heading: 'User API Keys',
        body: [
          'User-supplied provider credentials are handled through server-side API routes and encrypted storage. Status APIs must not return plaintext secrets.',
          'If any provider credential is exposed, rotate it immediately and report the exposure.',
        ],
      },
      {
        heading: 'Reporting',
        body: [
          'Report suspected vulnerabilities to security@tacitus.me with reproduction steps, affected routes, and expected impact.',
          'Critical reports involving active exploitation, auth bypass, exfiltration, or public secret exposure are treated as urgent incidents.',
        ],
      },
    ],
  },
  {
    slug: 'sub-processors',
    title: 'Sub-processors',
    summary: 'Infrastructure and service providers that may process PRAXIS customer or workspace data.',
    updatedAt: '2026-05-19',
    pendingLegalReview: true,
    sections: [
      {
        heading: 'Active Providers',
        body: [
          'Google Cloud provides core infrastructure, including Cloud Run, Firestore, Cloud SQL, Cloud Storage, Secret Manager, Cloud Tasks, Pub/Sub, Cloud Build, Artifact Registry, and Vertex AI.',
          'Cloudflare provides DNS. GitHub hosts source code and does not process customer workspace data. Polar may process billing and customer portal data when subscriptions are activated.',
        ],
      },
      {
        heading: 'Data Residency',
        body: [
          'The default production region is currently United States infrastructure, with PRAXIS operations centered on Google Cloud. EU residency options are tracked as a compliance roadmap item.',
          'Specific enterprise residency or DPA requirements should be reviewed before onboarding regulated workloads.',
        ],
      },
      {
        heading: 'Removed Providers',
        body: [
          'Dedicated structured-feed and scraper providers previously evaluated for PRAXIS are not part of the current launch processing stack unless a future product decision reintroduces them.',
        ],
      },
    ],
  },
  {
    slug: 'data-retention',
    title: 'Data Retention',
    summary: 'Current retention posture for account, workspace, document, output, telemetry, and audit data.',
    updatedAt: '2026-05-19',
    pendingLegalReview: true,
    sections: [
      {
        heading: 'Workspace Data',
        body: [
          'Workspace data is retained while an account or workspace remains active so PRAXIS can provide continuity across ContextCapsules, conversations, source receipts, documents, and outputs.',
          'Generated artifacts and audit receipts are retained with the workspace unless deleted through supported product or support workflows.',
        ],
      },
      {
        heading: 'Operational Data',
        body: [
          'Operational logs, health checks, runtime ledgers, and security audit artifacts are retained for reliability, abuse prevention, and incident response.',
          'Launch-readiness artifacts redact bearer tokens, secrets, service-account emails, and private-key-shaped values before being saved.',
        ],
      },
      {
        heading: 'Deletion',
        body: [
          'Account deletion is treated as a GDPR-style erasure request where applicable. Some records may be retained where required for security, billing, abuse prevention, legal obligations, or backup integrity.',
        ],
      },
    ],
  },
];

export function getLegalPage(slug: string): LegalPage | null {
  return legalPages.find((page) => page.slug === slug) ?? null;
}
