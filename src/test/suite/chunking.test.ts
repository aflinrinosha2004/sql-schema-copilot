import * as assert from 'assert';
import { chunkSchema } from '../../engine/chunking';
import { ParsedSchema } from '../../sql/parser';

describe('chunkSchema', () => {
  const schema: ParsedSchema = {
    tables: [
      {
        name: 'users',
        columns: [
          { name: 'id', type: 'int', nullable: false, isPrimaryKey: true },
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

  it('produces one chunk per table with column and foreign-key text', () => {
    const chunks = chunkSchema(schema);
    assert.strictEqual(chunks.length, 2);

    const usersChunk = chunks.find((c) => c.tableName === 'users');
    assert.ok(usersChunk);
    assert.ok(usersChunk!.text.includes('PRIMARY KEY'));
    assert.ok(usersChunk!.text.includes('references teams.id'));
    assert.deepStrictEqual(usersChunk!.relatedTables, ['teams']);
  });

  it('records reverse references so the referenced table knows who points at it', () => {
    const chunks = chunkSchema(schema);
    const teamsChunk = chunks.find((c) => c.tableName === 'teams');
    assert.ok(teamsChunk);
    assert.ok(teamsChunk!.text.includes('Referenced by: users'));
    assert.deepStrictEqual(teamsChunk!.relatedTables, ['users']);
  });
});
