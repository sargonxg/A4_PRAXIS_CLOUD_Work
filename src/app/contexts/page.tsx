import { redirect } from 'next/navigation';

export const metadata = { title: 'Situation Cores | PRAXIS' };

export default function PublicContextsRedirectPage() {
  redirect('/app/cores/context');
}
