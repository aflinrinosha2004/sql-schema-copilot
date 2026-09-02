import * as assert from 'assert';
import { RelationshipGraph } from '../../engine/graph/relationshipGraph';
import { ParsedSchema } from '../../sql/parser';

describe('RelationshipGraph', () => {
  const schema: ParsedSchema = {
    tables: [
      {
        name: 'orders',
        columns: [],
        foreignKeys: [{ column: 'customer_id', referencesTable: 'customers', referencesColumn: 'id' }],
        sourceFile: 'schema/orders.sql',
        sourceLine: 1
      },
      { name: 'customers', columns: [], foreignKeys: [], sourceFile: 'schema/customers.sql', sourceLine: 1 }
    ]
  };

  it('links both directions between related tables', () => {
    const graph = new RelationshipGraph(schema);
    assert.deepStrictEqual(graph.getRelatedTables('orders'), ['customers']);
    assert.deepStrictEqual(graph.getRelatedTables('customers'), ['orders']);
  });

  it('exposes the raw edge list with the linking column', () => {
    const graph = new RelationshipGraph(schema);
    const edges = graph.getAllEdges();
    assert.strictEqual(edges.length, 1);
    assert.strictEqual(edges[0].via, 'customer_id');
  });

  it('renders valid-looking Graphviz DOT output', () => {
    const graph = new RelationshipGraph(schema);
    const dot = graph.toDot();
    assert.ok(dot.startsWith('digraph schema {'));
    assert.ok(dot.includes('"orders" -> "customers"'));
  });
});
