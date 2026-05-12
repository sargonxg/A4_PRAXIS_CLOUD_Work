import { redirect } from 'next/navigation';

export const metadata = {
  title: 'PRAXIS Workbench Redirect',
  robots: 'noindex, nofollow',
};

export default async function DemoContextRedirectPage({
  params,
}: {
  params: Promise<{ contextId: string }>;
}) {
  const { contextId } = await params;
  redirect(`/app/workbench/${encodeURIComponent(contextId)}`);
}
