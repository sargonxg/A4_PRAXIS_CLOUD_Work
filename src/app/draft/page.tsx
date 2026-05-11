import { DraftingInbox } from '@/components/draft/DraftingInbox';

export const metadata = {
  title: 'Drafting Studio | PRAXIS',
};

export default async function DraftPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; template?: string; status?: string }>;
}) {
  const params = await searchParams;
  return <DraftingInbox query={params?.q} templateId={params?.template} status={params?.status} />;
}
