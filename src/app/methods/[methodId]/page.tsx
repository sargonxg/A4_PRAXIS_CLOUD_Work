import { redirect } from 'next/navigation';

export const metadata = { title: 'Tool Redirect | PRAXIS' };

export default async function PublicMethodRedirectPage({
  params,
}: {
  params: Promise<{ methodId: string }>;
}) {
  const { methodId } = await params;
  redirect(`/app/tools?method=${encodeURIComponent(methodId)}`);
}
