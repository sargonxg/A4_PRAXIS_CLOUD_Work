import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { AgentExecutionLeaseError } from '@/lib/agent-runtime/execution-lease';

/** Workers use service credentials, so client security rules are insufficient. */
export async function assertAgentOwnerWritable(uid: string): Promise<void> {
  try {
    const owner = await getAdminDbOrThrow().collection('users').doc(uid).get();
    const deletionState = owner.data()?.accountDeletionStatus;
    if (!owner.exists || deletionState === 'deleting' || deletionState === 'deleted') {
      throw new AgentExecutionLeaseError('The run owner is unavailable or account cleanup has started.');
    }
  } catch (error) {
    if (error instanceof AgentExecutionLeaseError) throw error;
    throw new AgentExecutionLeaseError('Account state could not be verified; retry before writing results.');
  }
}
