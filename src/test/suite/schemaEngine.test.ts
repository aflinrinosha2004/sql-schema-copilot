import * as assert from 'assert';
import { RealSchemaEngine } from '../../engine/schemaEngine';
import { HashingEmbeddingProvider } from '../../engine/embeddings/hashingEmbeddingProvider';
import { LlmProvider } from '../../engine/llm/llmProvider';
import { ParsedSchema } from '../../sql/parser';

class FakeLlmProvider implements LlmProvider {
  public readonly name = 'fake';
  public lastPrompt = '';

  async generate(prompt: string): Promise<string> {
    this.lastPrompt = prompt;
    return 'FAKE ANSWER';
  }
}

const schema: ParsedSchema = {
  tables: [
    {
      name: 'orders',
      columns: [
        { name: 'id', type: 'int', nullable: false, isPrimaryKey: true },
        { name: 'customer_id', type: 'int', nullable: false, isPrimaryKey: false }
      ],
      foreignKeys: [{ column: 'customer_id', referencesTable: 'customers', referencesColumn: 'id' }],
      sourceFile: 'schema/orders.sql',
      sourceLine: 1
    },
    {
      name: 'customers',
      columns: [{ name: 'id', type: 'int', nullable: false, isPrimaryKey: true }],
      foreignKeys: [],
      sourceFile: 'schema/customers.sql',
      sourceLine: 1
    }
  ]
};

describe('RealSchemaEngine', () => {
  it('answers with no context before anything is indexed', async () => {
    const engine = new RealSchemaEngine({ embeddingProvider: new HashingEmbeddingProvider(), llmProvider: new FakeLlmProvider() });
    const answer = await engine.askQuestion('what tables exist?');
    assert.ok(answer.includes('No schema has been indexed yet'));
  });

  it('grounds the prompt in retrieved schema chunks and cites sources', async () => {
    const llm = new FakeLlmProvider();
    const engine = new RealSchemaEngine({ embeddingProvider: new HashingEmbeddingProvider(), llmProvider: llm });

    await engine.indexSchema(schema);
    const answer = await engine.askQuestion('what does the orders table reference?');

    assert.ok(llm.lastPrompt.includes('SCHEMA CONTEXT'));
    assert.ok(answer.includes('FAKE ANSWER'));
    assert.ok(answer.includes('Sources:'));
  });

  it('explains a specific file using only that file\'s indexed chunks', async () => {
    const llm = new FakeLlmProvider();
    const engine = new RealSchemaEngine({ embeddingProvider: new HashingEmbeddingProvider(), llmProvider: llm });

    await engine.indexSchema(schema);
    const explanation = await engine.explainFile('schema/customers.sql');

    assert.ok(llm.lastPrompt.includes('Table: customers'));
    assert.ok(!llm.lastPrompt.includes('Table: orders'));
    assert.ok(explanation.includes('customers'));
  });

  it('drops a file\'s chunks when reindexed with an empty schema (delete)', async () => {
    const engine = new RealSchemaEngine({ embeddingProvider: new HashingEmbeddingProvider(), llmProvider: new FakeLlmProvider() });
    await engine.indexSchema(schema);
    assert.strictEqual(engine.getIndexedChunkCount(), 2);

    await engine.reindexFile({ tables: [] }, 'schema/customers.sql');
    assert.strictEqual(engine.getIndexedChunkCount(), 1);
  });
});
