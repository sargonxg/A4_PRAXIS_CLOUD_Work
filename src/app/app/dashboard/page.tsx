import { redirect } from 'next/navigation';

export default function DashboardLegacyRedirect() {
  redirect('/app/workbench');
}
