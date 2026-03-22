import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from './config';

export interface Report {
  id: string;
  situationId: string;
  title: string;
  type: 'situation-report' | 'intel-brief' | 'risk-assessment' | 'mediation-brief' | 'negotiation-prep' | 'stakeholder-analysis';
  status: 'draft' | 'review' | 'final';
  sections: { title: string; content: string }[];
  audience: string;
  createdAt: string;
  updatedAt: string;
}

function reportsRef(uid: string, situationId: string) {
  return collection(db, 'users', uid, 'situations', situationId, 'reports');
}

function reportDoc(uid: string, situationId: string, reportId: string) {
  return doc(db, 'users', uid, 'situations', situationId, 'reports', reportId);
}

export async function createReport(uid: string, situationId: string, data: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report> {
  const ref = doc(reportsRef(uid, situationId));
  const now = new Date().toISOString();
  const report: Report = { ...data, id: ref.id, createdAt: now, updatedAt: now };
  await setDoc(ref, report);
  return report;
}

export async function getReport(uid: string, situationId: string, reportId: string): Promise<Report | null> {
  const snap = await getDoc(reportDoc(uid, situationId, reportId));
  return snap.exists() ? (snap.data() as Report) : null;
}

export async function listReports(uid: string, situationId: string): Promise<Report[]> {
  const q = query(reportsRef(uid, situationId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Report);
}

export async function updateReport(uid: string, situationId: string, reportId: string, updates: Partial<Report>): Promise<void> {
  await updateDoc(reportDoc(uid, situationId, reportId), { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteReport(uid: string, situationId: string, reportId: string): Promise<void> {
  await deleteDoc(reportDoc(uid, situationId, reportId));
}
