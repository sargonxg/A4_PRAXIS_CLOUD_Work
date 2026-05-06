import { redirect } from 'next/navigation';

export default async function SyriaCaseLegacyRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const next = new URLSearchParams({ tab: 'chapters' });
  for (const key of ['recording', 'case', 'chapter']) {
    const value = query[key];
    if (typeof value === 'string') next.set(key, value);
  }
  redirect(`/app/workbench/syria-2026?${next.toString()}`);
}
