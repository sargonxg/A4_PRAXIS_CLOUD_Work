import { Suspense } from 'react';
import { AccountSettingsPage } from '@/components/settings/account-settings-page';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading settings...</div>}>
      <AccountSettingsPage />
    </Suspense>
  );
}
