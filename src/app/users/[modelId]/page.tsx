import { redirect } from 'next/navigation';

export const metadata = { title: 'User Core Redirect | PRAXIS' };

export default function PublicUserModelRedirectPage() {
  redirect('/app/cores/user');
}
