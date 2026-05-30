import { headers } from 'next/headers';
import { PraxisMarketingHome } from '@/components/marketing/praxis-marketing-home';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://praxis.tacitus.me';
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
const description = 'Turn any policy question into a sourced, citable brief.';

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
      {gaMeasurementId ? (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} nonce={nonce} suppressHydrationWarning />
          <script
            nonce={nonce}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', { anonymize_ip: true });
              `,
            }}
          />
        </>
      ) : null}
      <PraxisMarketingHome />
    </>
  );
}
