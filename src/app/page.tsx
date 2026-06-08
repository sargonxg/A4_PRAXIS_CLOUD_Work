import { headers } from 'next/headers';
import { PraxisMarketingHome } from '@/components/marketing/praxis-marketing-home';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://praxis.tacitus.me';
const description = 'Ask a policy question, build a ContextCapsule, and produce sourced work with receipts.';

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PRAXIS by TACITUS',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Policy workbench',
  operatingSystem: 'Web',
  description,
  url: siteUrl,
  image: `${siteUrl}/opengraph-image`,
  inLanguage: 'en',
  creator: {
    '@type': 'Organization',
    name: 'TACITUS',
    url: 'https://tacitus.me',
  },
  featureList: [
    'Context Capsules for reusable policy context',
    'Agentic research runs with visible proof',
    'Capsule marketplace with verified starter files',
    'Source receipts, claim support, and reviewable drafts',
  ],
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'TACITUS',
  url: 'https://tacitus.me',
  logo: `${siteUrl}/favicon.svg`,
  sameAs: ['https://praxis.tacitus.me', 'https://tacitus.me'],
};

export default async function Page() {
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <PraxisMarketingHome />
    </>
  );
}
