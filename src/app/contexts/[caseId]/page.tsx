import { redirect } from 'next/navigation';

export const metadata = { title: 'Context Redirect | PRAXIS' };

export default async function PublicContextDetailRedirectPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  redirect(`/app/workbench/${encodeURIComponent(caseId)}`);
}
