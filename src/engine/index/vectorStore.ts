import * as fs from 'fs';
import { SchemaChunk } from '../chunking';

export interface VectorRecord {
  id: string;
  vector: number[];
  chunk: SchemaChunk;
}

export interface ScoredRecord {
  record: VectorRecord;
  score: number;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  const length = Math.min(a.length, b.length);

  for (let i = 0; i < length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Lightweight local vector index. A brute-force cosine-similarity scan is
 * intentional: a single project's schema is at most a few hundred tables, so
 * there is no need for an ANN library or a native dependency. Records can be
 * persisted to a single JSON file for incremental reuse across sessions.
 */
export class VectorStore {
  private records = new Map<string, VectorRecord>();

  public upsert(record: VectorRecord): void {
    this.records.set(record.id, record);
  }

  public remove(id: string): void {
    this.records.delete(id);
  }

  public removeBySourceFile(sourceFile: string): void {
    for (const [id, record] of this.records) {
      if (record.chunk.sourceFile === sourceFile) {
        this.records.delete(id);
      }
    }
  }

  public size(): number {
    return this.records.size;
  }

  public query(vector: number[], topK = 5): ScoredRecord[] {
    const scored: ScoredRecord[] = [];
    for (const record of this.records.values()) {
      scored.push({ record, score: cosineSimilarity(vector, record.vector) });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  public getBySourceFile(sourceFile: string): VectorRecord[] {
    return Array.from(this.records.values()).filter((record) => record.chunk.sourceFile === sourceFile);
  }

  public saveToDisk(filePath: string): void {
    const payload = Array.from(this.records.values());
    fs.writeFileSync(filePath, JSON.stringify(payload), 'utf8');
  }

  public static loadFromDisk(filePath: string): VectorStore {
    const store = new VectorStore();
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const payload = JSON.parse(raw) as VectorRecord[];
      for (const record of payload) {
        store.upsert(record);
      }
    } catch {
      // No cache on disk yet - start with an empty store.
    }
    return store;
  }
}
