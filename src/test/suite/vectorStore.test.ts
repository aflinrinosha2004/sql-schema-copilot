import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { VectorStore } from '../../engine/index/vectorStore';
import { SchemaChunk } from '../../engine/chunking';

function makeChunk(tableName: string, sourceFile: string): SchemaChunk {
  return { id: `${sourceFile}#${tableName}`, tableName, text: tableName, sourceFile, sourceLine: 1, relatedTables: [] };
}

describe('VectorStore', () => {
  it('returns the closest vector first', () => {
    const store = new VectorStore();
    store.upsert({ id: 'a', vector: [1, 0], chunk: makeChunk('a', 'a.sql') });
    store.upsert({ id: 'b', vector: [0, 1], chunk: makeChunk('b', 'b.sql') });

    const results = store.query([0.9, 0.1], 1);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].record.id, 'a');
  });

  it('removes all records for a given source file', () => {
    const store = new VectorStore();
    store.upsert({ id: 'a', vector: [1, 0], chunk: makeChunk('a', 'shared.sql') });
    store.upsert({ id: 'b', vector: [0, 1], chunk: makeChunk('b', 'shared.sql') });
    store.upsert({ id: 'c', vector: [1, 1], chunk: makeChunk('c', 'other.sql') });

    store.removeBySourceFile('shared.sql');
    assert.strictEqual(store.size(), 1);
  });

  it('persists to and loads back from disk', () => {
    const store = new VectorStore();
    store.upsert({ id: 'a', vector: [1, 0], chunk: makeChunk('a', 'a.sql') });

    const tempFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'vector-store-')), 'store.json');
    store.saveToDisk(tempFile);

    const reloaded = VectorStore.loadFromDisk(tempFile);
    assert.strictEqual(reloaded.size(), 1);
  });
});
