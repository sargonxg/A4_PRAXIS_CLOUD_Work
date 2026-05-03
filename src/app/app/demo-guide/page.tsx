import { redirect } from 'next/navigation';

export default function LegacyDemoGuidePage() {
  redirect('/app/syria-case?recording=1&case=syria');
}
