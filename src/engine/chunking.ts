import { ParsedSchema, TableDefinition } from '../sql/parser';
import { normalizeSourcePath } from './pathUtils';

export interface SchemaChunk {
  id: string;
  tableName: string;
  text: string;
  sourceFile: string;
  sourceLine: number;
  relatedTables: string[];
}

function describeColumn(column: TableDefinition['columns'][number]): string {
  const parts = [`${column.name} ${column.type}`];
  if (column.isPrimaryKey) {
    parts.push('PRIMARY KEY');
  }
  parts.push(column.nullable ? 'NULLABLE' : 'NOT NULL');
  return parts.join(' ');
}

function reverseReferences(tables: TableDefinition[]): Map<string, Set<string>> {
  const reverse = new Map<string, Set<string>>();

  for (const table of tables) {
    for (const fk of table.foreignKeys) {
      const referrers = reverse.get(fk.referencesTable) ?? new Set<string>();
      referrers.add(table.name);
      reverse.set(fk.referencesTable, referrers);
    }
  }

  return reverse;
}

export function chunkTable(table: TableDefinition, reverse: Map<string, Set<string>>): SchemaChunk {
  const columnLines = table.columns.map((c) => `  - ${describeColumn(c)}`).join('\n');
  const fkLines = table.foreignKeys
    .map((fk) => `  - ${fk.column} references ${fk.referencesTable}.${fk.referencesColumn}`)
    .join('\n');

  const referencedBy = Array.from(reverse.get(table.name) ?? []);
  const sourceFile = normalizeSourcePath(table.sourceFile);

  const text = [
    `Table: ${table.name}`,
    `Defined in ${sourceFile}, line ${table.sourceLine}.`,
    'Columns:',
    columnLines || '  (no columns parsed)',
    table.foreignKeys.length > 0 ? 'Foreign keys:' : '',
    fkLines,
    referencedBy.length > 0 ? `Referenced by: ${referencedBy.join(', ')}` : ''
  ]
    .filter((line) => line.length > 0)
    .join('\n');

  const relatedTables = Array.from(
    new Set([...table.foreignKeys.map((fk) => fk.referencesTable), ...referencedBy])
  );

  return {
    id: `${sourceFile}#${table.name}`,
    tableName: table.name,
    text,
    sourceFile,
    sourceLine: table.sourceLine,
    relatedTables
  };
}

export function chunkSchema(schema: ParsedSchema): SchemaChunk[] {
  const reverse = reverseReferences(schema.tables);
  return schema.tables.map((table) => chunkTable(table, reverse));
}
