import { redirect } from 'next/navigation';

export const metadata = {
  title: 'PRAXIS Workbench Redirect',
  robots: 'noindex, nofollow',
};

export default function SyriaDemoRedirectPage() {
  redirect('/app/workbench/syria-2026');
}
