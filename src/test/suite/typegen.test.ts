import * as assert from 'assert';
import { generateTypeScriptInterfaces } from '../../engine/codegen/typegen';
import { ParsedSchema } from '../../sql/parser';

describe('generateTypeScriptInterfaces', () => {
  const schema: ParsedSchema = {
    tables: [
      {
        name: 'order_items',
        columns: [
          { name: 'id', type: 'int', nullable: false, isPrimaryKey: true },
          { name: 'quantity', type: 'int', nullable: false, isPrimaryKey: false },
          { name: 'notes', type: 'text', nullable: true, isPrimaryKey: false },
          { name: 'is_gift', type: 'boolean', nullable: false, isPrimaryKey: false }
        ],
        foreignKeys: [],
        sourceFile: 'schema/order_items.sql',
        sourceLine: 1
      }
    ]
  };

  it('generates a PascalCase interface with mapped TS types', () => {
    const output = generateTypeScriptInterfaces(schema);
    assert.ok(output.includes('export interface OrderItems {'));
    assert.ok(output.includes('id: number;'));
    assert.ok(output.includes('quantity: number;'));
    assert.ok(output.includes('notes: string | null;'));
    assert.ok(output.includes('is_gift: boolean;'));
  });
});
