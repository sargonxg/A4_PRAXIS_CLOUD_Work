import { headers } from 'next/headers';
import { PraxisMarketingHome } from '@/components/marketing/praxis-marketing-home';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://praxis.tacitus.me';
const description = 'Turn a hard policy question into sourced work your team can review.';

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
    '@type': 'Person',
    name: 'Giulio Catanzariti',
    url: 'https://tacitus.me',
  },
  featureList: [
    'Ask PRAXIS from one simple workspace',
    'Attach sources and saved context when the work needs proof',
    'Draft briefs, memos, and handovers with receipts',
    'Keep source gaps and review notes visible',
  ],
};

const operatorJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Giulio Catanzariti',
  url: 'https://tacitus.me',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(operatorJsonLd) }}
      />
      <PraxisMarketingHome />
    </>
  );
}
