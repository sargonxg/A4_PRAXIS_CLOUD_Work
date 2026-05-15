import { redirect } from 'next/navigation';

export const metadata = {
  title: 'PRAXIS',
  robots: 'noindex, nofollow',
};

export default function TourPage() {
  redirect('/');
}
