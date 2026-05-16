export interface DraftProvenanceRecord {
  draftId: string;
  sourceReceiptIds: string[];
  updatedAt: string;
}

const records = new Map<string, DraftProvenanceRecord>();

export function saveDraftProvenance(record: DraftProvenanceRecord): void {
  records.set(record.draftId, record);
}

export function getDraftProvenance(draftId: string): DraftProvenanceRecord | null {
  return records.get(draftId) ?? null;
}
