import { redirect } from 'next/navigation';

export default function RepositoryPage() {
  redirect('/app/capsules?lane=repository');
}
