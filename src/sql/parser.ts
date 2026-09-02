import { Parser } from 'node-sql-parser';

export interface ParsedSchema { tables: TableDefinition[]; }
export interface TableDefinition {
  name: string; columns: ColumnDefinition[];
  foreignKeys: ForeignKeyDefinition[];
  sourceFile: string; sourceLine: number;
}
export interface ColumnDefinition {
  name: string; type: string; nullable: boolean; isPrimaryKey: boolean;
}
export interface ForeignKeyDefinition {
  column: string; referencesTable: string; referencesColumn: string;
}

export function parseSchemaSql(sql: string, sourceFile = 'unknown.sql', sourceLine = 1): ParsedSchema {
  const parser = new Parser();
  const ast = parser.astify(sql, { database: 'MySQL' }) as any[];
  const tables: TableDefinition[] = [];

  const statements = Array.isArray(ast) ? ast : [ast];

  for (const statement of statements) {
    if (!statement || statement.type !== 'create') {
      continue;
    }

    const tableName = statement.table?.[0]?.table || statement.table || 'unknown_table';
    const columns: ColumnDefinition[] = [];
    const foreignKeys: ForeignKeyDefinition[] = [];

    const createDefinitions = Array.isArray(statement.create_definitions) ? statement.create_definitions : [];

    for (const definition of createDefinitions) {
      if (!definition || definition.resource === 'constraint') {
        const constraintColumns = Array.isArray(definition?.definition) ? definition.definition : [];
        const column = constraintColumns[0]?.column || constraintColumns[0]?.field || 'unknown_column';
        const referenceTable = definition.reference_definition?.table?.[0]?.table || definition.reference_definition?.table || 'unknown_table';
        const referenceColumn = definition.reference_definition?.definition?.[0]?.column || 'id';

        if (column && referenceTable) {
          foreignKeys.push({
            column,
            referencesTable: referenceTable,
            referencesColumn: referenceColumn
          });
        }
        continue;
      }

      const columnName = definition.column?.column || definition.column || 'unknown_column';
      const type = definition.definition?.dataType || definition.definition?.type || 'unknown';
      const nullable = !definition.nullable || definition.nullable?.type !== 'not null';
      const isPrimaryKey = Boolean(definition.primary_key === 'primary key' || definition.primary_key === 'PRIMARY KEY');

      columns.push({
        name: columnName,
        type,
        nullable,
        isPrimaryKey
      });
    }

    tables.push({
      name: tableName,
      columns,
      foreignKeys,
      sourceFile,
      sourceLine
    });
  }

  return { tables };
}
