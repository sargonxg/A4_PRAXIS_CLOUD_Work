import { redirect } from 'next/navigation';

export const metadata = { title: 'Memo Output | PRAXIS' };

export default function PublicDraftRedirectPage() {
  redirect('/app/workbench?openChapter=memos');
}
