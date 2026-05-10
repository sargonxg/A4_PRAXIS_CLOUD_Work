import { notFound } from 'next/navigation';
import { UserModelEditor } from '@/components/users/UserModelEditor';
import { PUBLIC_USER_MODELS, getPublicUserModel } from '@/lib/user-models/seeds';

export const metadata = { title: 'User Model | PRAXIS' };

export default async function UserModelPage({
  params,
}: {
  params: Promise<{ modelId: string }>;
}) {
  const { modelId } = await params;
  const model = getPublicUserModel(modelId) ?? PUBLIC_USER_MODELS.find((seed) => modelId.startsWith(`${seed.modelId}-`));
  if (!model) notFound();
  return <UserModelEditor seed={model} modelId={modelId} />;
}
