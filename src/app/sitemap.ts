import type { MetadataRoute } from 'next';
import { legalPages } from '@/lib/legal/pages';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://praxis.tacitus.me';
  const lastModified = new Date();

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/learn`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/release-notes`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...legalPages.map((page) => ({
      url: `${baseUrl}/legal/${page.slug}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),
  ];
}
