import { redirect } from 'next/navigation';

export const metadata = { title: 'Memo Redirect | PRAXIS' };

export default async function PublicDraftDetailRedirectPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const { draftId } = await params;
  redirect(`/app/workbench?openChapter=memos&draft=${encodeURIComponent(draftId)}`);
}
