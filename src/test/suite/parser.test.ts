import * as assert from 'assert';
import { parseSchemaSql } from '../../sql/parser';

describe('SQL parser wrapper', () => {
  it('parses a create table statement into the shared shape', () => {
    const sql = `
      CREATE TABLE users (
        id INT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        team_id INT,
        FOREIGN KEY (team_id) REFERENCES teams(id)
      );
    `;

    const result = parseSchemaSql(sql, 'schema/users.sql', 1);

    assert.strictEqual(result.tables.length, 1);
    assert.strictEqual(result.tables[0].name, 'users');
    assert.strictEqual(result.tables[0].columns.length, 3);
    assert.strictEqual(result.tables[0].foreignKeys.length, 1);
    assert.strictEqual(result.tables[0].foreignKeys[0].column, 'team_id');
    assert.strictEqual(result.tables[0].foreignKeys[0].referencesTable, 'teams');
    assert.strictEqual(result.tables[0].foreignKeys[0].referencesColumn, 'id');
  });
});
