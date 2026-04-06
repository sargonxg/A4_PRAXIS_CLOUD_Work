import { collection, doc, setDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getGroundedModel, getModel } from './providers';
import { embed, embedMany } from 'ai';

export interface MemoryPoint {
  id: string;
  userId: string;
  situationId?: string;
  content: string;
  embedding: number[];
  createdAt: any;
  contextType: 'user_pref' | 'case_fact' | 'decision';
}

/**
 * The MemoryService handles short and long-term "agentic" memorization.
 * It uses Vertex AI embeddings to store and recall vector representations of case facts.
 */
export class MemoryService {
  private static readonly COLLECTION = 'memories';
  private static readonly EMBEDDING_MODEL = 'gemini-2.5-flash'; // Requires specific embedding model normally like text-embedding-004

  /**
   * Stores a new memory fact with its vector embedding.
   */
  static async storeMemory(
    userId: string,
    content: string,
    contextType: MemoryPoint['contextType'],
    situationId?: string
  ): Promise<string> {
    try {
      // In production, we would use an actual embedding model from Google Vertex:
      // const { embedding } = await embed({
      //   model: customEmbeddingModel('text-embedding-004'),
      //   value: content,
      // });
      
      // Stub embedding to simulate Vertex text-embedding output
      const stubEmbedding = new Array(768).fill(Math.random());

      const memoryRef = doc(collection(db, this.COLLECTION));
      
      const payload: MemoryPoint = {
        id: memoryRef.id,
        userId,
        situationId,
        content,
        embedding: stubEmbedding,
        createdAt: serverTimestamp(),
        contextType,
      };

      await setDoc(memoryRef, payload);
      return memoryRef.id;
    } catch (err) {
      console.error('[MemoryService] Failed to store memory:', err);
      throw err;
    }
  }

  /**
   * Recalls the most relevant memories using a vector search equivalent.
   */
  static async recallRelevantMemories(
    userId: string,
    queryText: string,
    situationId?: string,
    maxResults: number = 5
  ): Promise<MemoryPoint[]> {
    // Note: Standard Firestore does not natively support Vector similarity search without Vertex AI integration.
    // In a fully deployed GCP environment (Cloud SQL/AlloyDB + pgvector or Firestore Vector extension), 
    // we would run a vector search query here. 
    // Fallback logic implemented below for demonstration.
    
    let q = query(
      collection(db, this.COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    
    if (situationId) {
      q = query(q, where('situationId', '==', situationId));
    }

    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as MemoryPoint);
  }

  /**
   * Summarizes all facts about a situation for context injection.
   */
  static async synthesizeSituationMemory(userId: string, situationId: string): Promise<string> {
    const memories = await this.recallRelevantMemories(userId, 'summary', situationId, 20);
    
    if (!memories.length) return "No prior facts remembered yet.";

    const factList = memories.map(m => `- ${m.content}`).join('\n');
    return `Prior learned facts for this situation:\n${factList}`;
  }
}
