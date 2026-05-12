import { redirect } from 'next/navigation';

export const metadata = { title: 'Tools | PRAXIS' };

export default function PublicMethodsRedirectPage() {
  redirect('/app/tools');
}
