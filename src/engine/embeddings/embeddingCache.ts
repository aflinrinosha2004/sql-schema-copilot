import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Simple disk-backed cache so embeddings are not recomputed on every activation.
 * Stored as a single JSON map under <cacheDir>/embeddings.json, keyed by a hash
 * of (provider name + chunk text).
 */
export class EmbeddingCache {
  private readonly filePath: string;
  private store: Record<string, number[]>;

  constructor(cacheDir: string) {
    this.filePath = path.join(cacheDir, 'embeddings.json');
    this.store = this.loadFromDisk();
  }

  public static keyFor(providerName: string, text: string): string {
    return crypto.createHash('sha256').update(`${providerName}::${text}`).digest('hex');
  }

  public get(key: string): number[] | undefined {
    return this.store[key];
  }

  public set(key: string, vector: number[]): void {
    this.store[key] = vector;
  }

  public persist(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.filePath, JSON.stringify(this.store), 'utf8');
  }

  private loadFromDisk(): Record<string, number[]> {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
}
