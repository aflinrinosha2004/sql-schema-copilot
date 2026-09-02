import { EmbeddingProvider } from './embeddingProvider';

/**
 * Deterministic, dependency-free local embedding provider.
 *
 * Schema text is small and highly structured (table/column/type keywords), so a
 * hashed bag-of-words vector separates tables well without downloading a model.
 * It requires no network access and no native dependencies, so it always works
 * offline and is used as the default "local" provider. TransformersEmbeddingProvider
 * is available as a richer, opt-in alternative (see transformersEmbeddingProvider.ts).
 */
export class HashingEmbeddingProvider implements EmbeddingProvider {
  public readonly name = 'hashing-local';
  public readonly dimensions: number;

  constructor(dimensions = 256) {
    this.dimensions = dimensions;
  }

  public async embed(text: string): Promise<number[]> {
    const vector = new Array<number>(this.dimensions).fill(0);
    const tokens = tokenize(text);

    for (const token of tokens) {
      const index = hashToken(token) % this.dimensions;
      vector[index] += 1;
    }

    return normalize(vector);
  }

  public async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.embed(text)));
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((token) => token.length > 0);
}

function hashToken(token: string): number {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) {
    return vector;
  }
  return vector.map((value) => value / magnitude);
}
