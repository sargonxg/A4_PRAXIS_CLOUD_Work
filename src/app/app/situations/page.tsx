import { redirect } from 'next/navigation';

export default function SituationsIndexPage() {
  redirect('/app/situations/new');
}
