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
    summary: 'How PRAXIS handles account, workspace, source, document, and product telemetry data.',
    updatedAt: '2026-09-30',
    pendingLegalReview: false,
    sections: [
      {
        heading: 'Project Operator',
        body: [
          'PRAXIS is experimental research and analysis software operated by Giulio Catanzariti under the TACITUS project name. No TACITUS legal entity has been incorporated. Contact hello@tacitus.me about information access, correction or deletion without sending sensitive identity documents in an initial message.',
          'This notice describes the application. Website analytics and inquiries are described separately at https://www.tacitus.me/legal. Project status does not remove applicable privacy obligations.',
        ],
      },
      {
        heading: 'Data We Collect',
        body: [
          'PRAXIS stores account identifiers, authentication metadata, analyst profile choices, workspace configuration, saved context, user documents, source receipts, conversations, generated outputs, and operational telemetry needed to run the service.',
          'Uploaded documents and source material remain user workspace data. Storage can include original files, full extracted text, retrieval chunks and embeddings, metadata, source receipts, conversations and generated analysis; it is not limited to short excerpts.',
        ],
      },
      {
        heading: 'How We Use Data',
        body: [
          'We use workspace data to authenticate users, build context for AI-assisted analysis, persist outputs, maintain audit trails, debug reliability issues, and protect the service from abuse.',
          'We do not sell user data. The public provider page describes the documented baseline. Confirm enabled model, document and user-selected providers for the particular workflow before institutional material is shared; this notice does not certify a complete deployment-specific inventory.',
          'The current production posture uses United States infrastructure by default. Enterprise residency commitments require a separate written arrangement before regulated workloads are onboarded.',
        ],
      },
      {
        heading: 'AI Processing and Source Research',
        body: [
          'Selected workspace context and source material may be sent to the enabled model service to answer a question, extract proposed claims or draft analysis. Outside research can also send search terms to the configured search service and retrieve linked web pages.',
          'The response identifies the model/provider actually used where runtime information is available. A model name, premium label or citation does not establish a provider retention, training-use or confidentiality commitment. Such commitments must follow the applicable service configuration and agreement.',
          'A generated grounding summary is different from an original source passage. Retained source links, captured passages and model output support inspection; they do not independently certify a claim.',
        ],
      },
      {
        heading: 'User Control',
        body: [
          'Authenticated users can request export or account deletion through supported product or support workflows. Successful sign-out does not delete stored workspace data. Complete cross-store erasure, provider retention and backup exceptions require their own verification; an account closure alone is not proof of full erasure.',
          'Self-service erasure can be unavailable until storage access controls have been verified. Where it is enabled, cancel a renewing subscription first. Incomplete cleanup remains pending and must be retried or handled through support.',
          'Security or privacy requests can be sent to security@tacitus.me.',
        ],
      },
    ],
  },
  {
    slug: 'cookies',
    title: 'Cookie Notice',
    summary: 'How PRAXIS uses essential cookies, sign-in storage, analytics settings, and consent controls.',
    updatedAt: '2026-09-30',
    pendingLegalReview: false,
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
          'Optional Google and Firebase visit analytics are not initialized by the application. Any future introduction requires a separate permission interface. Essential sign-in, security and operational requests remain necessary to run the workspace.',
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
    summary: 'How access, correction, export, deletion, objection, restriction, and support requests work.',
    updatedAt: '2026-09-30',
    pendingLegalReview: false,
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
          'Saved context, uploaded documents, source receipts, conversations, generated outputs, and audit trails may contain user-provided or user-derived personal data.',
          'Deletion and export requests must identify their scope across workspace records, documents, outputs and operational records. Any legal, security, billing, abuse-prevention or backup exception must be assessed and communicated rather than inferred from deleting a sign-in identity.',
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
    title: 'Data Processing Overview',
    summary: 'Customer-data processing roles, instructions, providers, security controls, retention, deletion, and support channels.',
    updatedAt: '2026-09-30',
    pendingLegalReview: false,
    sections: [
      {
        heading: 'Processing Roles',
        body: [
          'This page describes processing for scoping purposes; it is not an executed data-processing agreement. Responsible parties, controller and processor roles, lawful instructions and safeguards must be established for the particular evaluation before institutional material is uploaded.',
          'The project operator is responsible for the processing they undertake. Applicable responsibilities depend on the actual processing; a project name does not replace the responsible person or contracting party.',
        ],
      },
      {
        heading: 'Processing Instructions',
        body: [
          'PRAXIS processes customer data to provide authenticated workspaces, saved context, document handling, retrieval, AI-assisted analysis, output generation, receipts, reliability monitoring, and support.',
          'The public provider page describes the documented baseline. Confirm the enabled model and document providers, user-selected integrations, provider terms and processing locations for the particular workflow.',
        ],
      },
      {
        heading: 'Security, Retention, and Deletion',
        body: [
          'PRAXIS applies server-side secret handling, role-based service access, encrypted provider-key storage, production security headers, audit receipts, and reliability controls as part of its baseline.',
          'Retention and deletion follow the public data-retention posture. Fixed periods, backup handling, provider data-use terms and regulated-workload commitments are confirmed for their actual configuration; the beta does not promise uniform immediate erasure or zero retention.',
        ],
      },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of Service',
    summary: 'Experimental-use terms: permitted inputs, human review, availability limits and mandatory rights.',
    updatedAt: '2026-09-30',
    pendingLegalReview: false,
    sections: [
      {
        heading: 'Experimental Service',
        body: [
          'PRAXIS is an experimental workspace operated by Giulio Catanzariti under the TACITUS project name. No TACITUS legal entity has been incorporated. Features, limits, integrations and access may change or be withdrawn as the project develops.',
          'Current free access is subject to the limits shown in the application. Paid upgrades are unavailable. Future prices, institutional options and feature descriptions are proposals, not purchase offers or service commitments.',
          'Team permissions, SSO, residency and private deployment require separate implementation, verification, identified contracting parties and applicable arrangements before any commitment.',
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
          'Recorded workflow checks do not certify analytical quality. AI-generated work may omit evidence, misattribute sources or make unsupported deductions. Independently check source passages, dates, calculations and conclusions.',
          'No service-level agreement, certification or guarantee of uninterrupted availability, analytical accuracy or suitability for a particular purpose is offered. Nothing in these terms excludes rights or liabilities that applicable law does not permit to be excluded.',
          'Use public or synthetic material for experimentation. Do not upload classified, privileged, sensitive personal or confidential institutional records without separately established authorization and suitable data-handling arrangements.',
        ],
      },
    ],
  },
  {
    slug: 'security',
    title: 'Security',
    summary: 'Security posture, reporting channel, and current launch-readiness baseline for PRAXIS.',
    updatedAt: '2026-09-30',
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
        heading: 'Scope of the Beta',
        body: [
          'Working sign-in, protected routes and reviewed release journeys do not establish an independent security certification or acceptance of every account, sharing and institutional workflow.',
          'SSO, organization roles, residency, private deployment, complete erasure and recovery commitments must be verified for their actual configured path before an institutional engagement relies on them.',
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
    updatedAt: '2026-09-30',
    pendingLegalReview: false,
    sections: [
      {
        heading: 'Documented Infrastructure Baseline',
        body: [
          'Google Cloud provides core infrastructure, including Cloud Run, Firestore, Cloud SQL, Cloud Storage, Secret Manager, Cloud Tasks, Pub/Sub, Cloud Build, Artifact Registry, and Vertex AI.',
          'Cloudflare provides DNS. GitHub hosts source code and workflow metadata. Polar is a documented billing integration; paid upgrades are unavailable and this listing does not offer a subscription.',
        ],
      },
      {
        heading: 'Model and Provider Configuration',
        body: [
          'Vertex AI is the default model runtime. Availability of other model paths depends on enabled configuration and provider access; actual execution may use an explicitly reported fallback.',
          'Provider data-use and retention commitments depend on the service and agreement in force. This provider list does not itself establish a no-training, zero-retention or regulated-data commitment for a model.',
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
    updatedAt: '2026-09-30',
    pendingLegalReview: false,
    sections: [
      {
        heading: 'Workspace Data',
        body: [
          'Workspace data is retained while an account or workspace remains active so PRAXIS can provide continuity across saved context, conversations, source receipts, documents, and outputs.',
          'Generated artifacts and audit receipts are retained with the workspace unless deleted through supported product or support workflows.',
          'Retention includes original uploaded files where stored, full extracted text, chunks/embeddings, capsule and review versions, conversations and generated products. Removing an attachment from a question does not itself erase these records.',
        ],
      },
      {
        heading: 'Operational Data',
        body: [
          'Operational logs, health checks, runtime ledgers, and security audit artifacts are retained for reliability, abuse prevention, and incident response.',
          'Logs, model traces and saved review/test evidence require separate handling from the main workspace. Redacted release evidence is not a guarantee that every operational record contains no user-derived text.',
          'The beta does not publish a single fixed retention period covering every workspace, operational, backup and provider record. Specific periods and exceptions must be confirmed for the actual store and configuration; no retention days are implied here.',
        ],
      },
      {
        heading: 'Deletion',
        body: [
          'Account deletion is treated as an erasure request where applicable. Completion must be checked across owner-scoped workspace records, uploaded and generated files, runtime records and relevant traces. Deleting an authentication account alone does not establish that all copies have been erased.',
          'The supported erasure workflow retains a minimal deletion marker and cleanup receipt. Billing webhook deduplication and provider accounting, platform logs and backups, shared published ontology records, and optional external indexes require their own retention or cleanup handling. A pending external cleanup is not reported as completed erasure.',
          'Legal, billing, security or backup exceptions and external provider records may require separate handling. Request a scope/status confirmation through security@tacitus.me; the current beta does not promise immediate removal from every backup or provider system.',
        ],
      },
    ],
  },
];

export function getLegalPage(slug: string): LegalPage | null {
  return legalPages.find((page) => page.slug === slug) ?? null;
}
