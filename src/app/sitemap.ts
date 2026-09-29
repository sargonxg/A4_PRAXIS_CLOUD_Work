import type { MetadataRoute } from 'next';
import { legalPages } from '@/lib/legal/pages';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://praxis.tacitus.me';

  // Omit lastModified where no maintained content date exists. Build time is
  // not an editorial update. Legal pages have an explicit, visible updatedAt.
  return [
    {
      url: baseUrl,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/learn`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guide`,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/pricing`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/release-notes`,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    ...legalPages.map((page) => ({
      url: `${baseUrl}/legal/${page.slug}`,
      lastModified: new Date(page.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),
  ];
}
