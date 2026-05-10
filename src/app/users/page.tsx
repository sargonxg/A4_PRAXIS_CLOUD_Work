import { UserModelsLibrary } from '@/components/users/UserModelsLibrary';
import { listPublicUserModels } from '@/lib/users/api';

export const metadata = { title: 'User Models | PRAXIS' };

export default function UsersPage() {
  return <UserModelsLibrary publicModels={listPublicUserModels()} />;
}
