import { getAdminDbOrThrow } from './admin';

export type WorkProductType = 'memo' | 'briefing' | 'talking_points' | 'dossier';
export type WorkProductStatus = 'draft' | 'final' | 'exported';

export interface WorkProduct {
  id: string;
  title: string;
  type: WorkProductType;
  status: WorkProductStatus;
  parentSources: string[];
  content: Record<string, unknown>;
  lastEditedAt: string;
  exportHistory: Array<{ exportedAt: string; format: string; manifestId?: string }>;
}

function workProductsCollection(uid: string, situationId: string) {
  return getAdminDbOrThrow()
    .collection('users')
    .doc(uid)
    .collection('situations')
    .doc(situationId)
    .collection('work_products');
}

export async function saveWorkProduct(uid: string, situationId: string, product: Omit<WorkProduct, 'id'>): Promise<WorkProduct> {
  const ref = workProductsCollection(uid, situationId).doc();
  const stored = { ...product, id: ref.id };
  await ref.set(stored);
  return stored;
}

export async function listWorkProducts(uid: string, situationId: string): Promise<WorkProduct[]> {
  const snap = await workProductsCollection(uid, situationId).orderBy('lastEditedAt', 'desc').limit(100).get();
  return snap.docs.map((doc) => doc.data() as WorkProduct);
}
