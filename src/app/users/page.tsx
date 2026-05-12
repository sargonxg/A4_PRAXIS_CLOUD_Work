import { redirect } from 'next/navigation';

export const metadata = { title: 'User Cores | PRAXIS' };

export default function PublicUsersRedirectPage() {
  redirect('/app/cores/user');
}
