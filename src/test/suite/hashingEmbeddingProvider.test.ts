import * as assert from 'assert';
import { HashingEmbeddingProvider } from '../../engine/embeddings/hashingEmbeddingProvider';

describe('HashingEmbeddingProvider', () => {
  it('is deterministic for the same text', async () => {
    const provider = new HashingEmbeddingProvider(64);
    const a = await provider.embed('Table: orders with column customer_id');
    const b = await provider.embed('Table: orders with column customer_id');
    assert.deepStrictEqual(a, b);
  });

  it('produces different vectors for unrelated text', async () => {
    const provider = new HashingEmbeddingProvider(64);
    const a = await provider.embed('Table: orders with column customer_id');
    const b = await provider.embed('Table: inventory with column warehouse_code');
    assert.notDeepStrictEqual(a, b);
  });

  it('returns a unit-length vector of the configured dimension', async () => {
    const provider = new HashingEmbeddingProvider(32);
    const vector = await provider.embed('some schema text');
    assert.strictEqual(vector.length, 32);
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    assert.ok(Math.abs(magnitude - 1) < 1e-6 || magnitude === 0);
  });
});
