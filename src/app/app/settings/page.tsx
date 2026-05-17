import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type SettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = new URLSearchParams();
  params.set('panel', 'account');

  const incoming = (await searchParams) ?? {};
  for (const [key, value] of Object.entries(incoming)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (typeof value === 'string') {
      params.set(key, value);
    }
  }

  redirect(`/app?${params.toString()}`);
}
