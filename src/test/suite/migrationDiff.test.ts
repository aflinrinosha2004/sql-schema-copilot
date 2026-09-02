import * as assert from 'assert';
import { diffSchemas, summarizeDiff } from '../../engine/migrationDiff';
import { ParsedSchema } from '../../sql/parser';

const before: ParsedSchema = {
  tables: [
    {
      name: 'users',
      columns: [
        { name: 'id', type: 'int', nullable: false, isPrimaryKey: true },
        { name: 'email', type: 'varchar', nullable: true, isPrimaryKey: false }
      ],
      foreignKeys: [],
      sourceFile: 'schema/users.sql',
      sourceLine: 1
    }
  ]
};

const after: ParsedSchema = {
  tables: [
    {
      name: 'users',
      columns: [
        { name: 'id', type: 'int', nullable: false, isPrimaryKey: true },
        { name: 'email', type: 'varchar', nullable: false, isPrimaryKey: false },
        { name: 'team_id', type: 'int', nullable: true, isPrimaryKey: false }
      ],
      foreignKeys: [{ column: 'team_id', referencesTable: 'teams', referencesColumn: 'id' }],
      sourceFile: 'schema/users.sql',
      sourceLine: 1
    },
    {
      name: 'teams',
      columns: [{ name: 'id', type: 'int', nullable: false, isPrimaryKey: true }],
      foreignKeys: [],
      sourceFile: 'schema/teams.sql',
      sourceLine: 1
    }
  ]
};

describe('diffSchemas', () => {
  it('detects added tables, columns, foreign keys, and nullability changes', () => {
    const diff = diffSchemas(before, after);

    assert.deepStrictEqual(diff.addedTables, ['teams']);
    assert.deepStrictEqual(diff.addedColumns, [{ table: 'users', column: 'team_id' }]);
    assert.strictEqual(diff.changedColumns.length, 1);
    assert.strictEqual(diff.changedColumns[0].column, 'email');
    assert.strictEqual(diff.addedForeignKeys.length, 1);
  });

  it('summarizes the diff as readable text', () => {
    const diff = diffSchemas(before, after);
    const summary = summarizeDiff(diff);
    assert.ok(summary.includes('Added table "teams"'));
    assert.ok(summary.includes('team_id'));
  });

  it('reports no differences for an identical schema', () => {
    const diff = diffSchemas(before, before);
    assert.strictEqual(summarizeDiff(diff), 'No structural differences were found between the two schemas.');
  });
});
