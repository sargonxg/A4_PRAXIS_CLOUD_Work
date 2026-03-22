import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from './config';

export interface ScenarioOutcome {
  label: string;
  probability: number;
  description: string;
  timeline: { months: number; event: string }[];
  decisionPoints: string[];
  risks: string[];
}

export interface Scenario {
  id: string;
  situationId: string;
  title: string;
  description: string;
  parameters: Record<string, number>;
  outcomes: ScenarioOutcome[];
  actorResponses: { actor: string; likelyAction: string; motivation: string }[];
  recommendations: string[];
  escalationImpact: { currentStage: number; projectedStage: number; trajectory: string } | null;
  createdAt: string;
}

function scenariosRef(uid: string, situationId: string) {
  return collection(db, 'users', uid, 'situations', situationId, 'scenarios');
}

export async function createScenario(uid: string, situationId: string, data: Omit<Scenario, 'id' | 'createdAt'>): Promise<Scenario> {
  const ref = doc(scenariosRef(uid, situationId));
  const scenario: Scenario = { ...data, id: ref.id, createdAt: new Date().toISOString() };
  await setDoc(ref, scenario);
  return scenario;
}

export async function getScenario(uid: string, situationId: string, scenarioId: string): Promise<Scenario | null> {
  const snap = await getDoc(doc(scenariosRef(uid, situationId), scenarioId));
  return snap.exists() ? (snap.data() as Scenario) : null;
}

export async function listScenarios(uid: string, situationId: string): Promise<Scenario[]> {
  const q = query(scenariosRef(uid, situationId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Scenario);
}

export async function deleteScenario(uid: string, situationId: string, scenarioId: string): Promise<void> {
  await deleteDoc(doc(scenariosRef(uid, situationId), scenarioId));
}
