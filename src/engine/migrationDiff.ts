import { ParsedSchema, TableDefinition, ColumnDefinition } from '../sql/parser';
import { LlmProvider } from './llm/llmProvider';

export interface ColumnChange {
  table: string;
  column: string;
  before: ColumnDefinition;
  after: ColumnDefinition;
}

export interface SchemaDiff {
  addedTables: string[];
  removedTables: string[];
  addedColumns: Array<{ table: string; column: string }>;
  removedColumns: Array<{ table: string; column: string }>;
  changedColumns: ColumnChange[];
  addedForeignKeys: Array<{ table: string; column: string; referencesTable: string }>;
  removedForeignKeys: Array<{ table: string; column: string; referencesTable: string }>;
}

function tableMap(schema: ParsedSchema): Map<string, TableDefinition> {
  return new Map(schema.tables.map((table) => [table.name, table]));
}

function columnMap(table: TableDefinition): Map<string, ColumnDefinition> {
  return new Map(table.columns.map((column) => [column.name, column]));
}

function columnsEqual(a: ColumnDefinition, b: ColumnDefinition): boolean {
  return a.type === b.type && a.nullable === b.nullable && a.isPrimaryKey === b.isPrimaryKey;
}

export function diffSchemas(before: ParsedSchema, after: ParsedSchema): SchemaDiff {
  const beforeTables = tableMap(before);
  const afterTables = tableMap(after);

  const diff: SchemaDiff = {
    addedTables: [],
    removedTables: [],
    addedColumns: [],
    removedColumns: [],
    changedColumns: [],
    addedForeignKeys: [],
    removedForeignKeys: []
  };

  for (const name of afterTables.keys()) {
    if (!beforeTables.has(name)) {
      diff.addedTables.push(name);
    }
  }
  for (const name of beforeTables.keys()) {
    if (!afterTables.has(name)) {
      diff.removedTables.push(name);
    }
  }

  for (const [name, afterTable] of afterTables) {
    const beforeTable = beforeTables.get(name);
    if (!beforeTable) {
      continue;
    }

    const beforeCols = columnMap(beforeTable);
    const afterCols = columnMap(afterTable);

    for (const [colName, afterCol] of afterCols) {
      const beforeCol = beforeCols.get(colName);
      if (!beforeCol) {
        diff.addedColumns.push({ table: name, column: colName });
      } else if (!columnsEqual(beforeCol, afterCol)) {
        diff.changedColumns.push({ table: name, column: colName, before: beforeCol, after: afterCol });
      }
    }
    for (const colName of beforeCols.keys()) {
      if (!afterCols.has(colName)) {
        diff.removedColumns.push({ table: name, column: colName });
      }
    }

    const beforeFks = new Set(beforeTable.foreignKeys.map((fk) => `${fk.column}->${fk.referencesTable}`));
    const afterFks = new Set(afterTable.foreignKeys.map((fk) => `${fk.column}->${fk.referencesTable}`));

    for (const fk of afterTable.foreignKeys) {
      if (!beforeFks.has(`${fk.column}->${fk.referencesTable}`)) {
        diff.addedForeignKeys.push({ table: name, column: fk.column, referencesTable: fk.referencesTable });
      }
    }
    for (const fk of beforeTable.foreignKeys) {
      if (!afterFks.has(`${fk.column}->${fk.referencesTable}`)) {
        diff.removedForeignKeys.push({ table: name, column: fk.column, referencesTable: fk.referencesTable });
      }
    }
  }

  return diff;
}

export function summarizeDiff(diff: SchemaDiff): string {
  const lines: string[] = [];

  diff.addedTables.forEach((t) => lines.push(`+ Added table "${t}".`));
  diff.removedTables.forEach((t) => lines.push(`- Removed table "${t}". Any code still referencing it will break.`));
  diff.addedColumns.forEach((c) => lines.push(`+ Added column "${c.column}" to "${c.table}".`));
  diff.removedColumns.forEach((c) =>
    lines.push(`- Removed column "${c.column}" from "${c.table}". Queries selecting it will fail.`)
  );
  diff.changedColumns.forEach((c) =>
    lines.push(
      `~ Changed "${c.table}.${c.column}": ${c.before.type}${c.before.nullable ? '' : ' NOT NULL'} -> ` +
        `${c.after.type}${c.after.nullable ? '' : ' NOT NULL'}.`
    )
  );
  diff.addedForeignKeys.forEach((fk) =>
    lines.push(`+ Added foreign key "${fk.table}.${fk.column}" -> "${fk.referencesTable}".`)
  );
  diff.removedForeignKeys.forEach((fk) =>
    lines.push(`- Removed foreign key "${fk.table}.${fk.column}" -> "${fk.referencesTable}".`)
  );

  return lines.length > 0 ? lines.join('\n') : 'No structural differences were found between the two schemas.';
}

/**
 * Produces a deterministic summary by default (no network needed, always
 * testable). If an LLM provider is supplied, it is used to phrase the same
 * facts as a more natural explanation - the provider never invents facts
 * beyond the deterministic summary it is given.
 */
export async function explainMigrationDiff(
  before: ParsedSchema,
  after: ParsedSchema,
  llmProvider?: LlmProvider
): Promise<string> {
  const diff = diffSchemas(before, after);
  const summary = summarizeDiff(diff);

  if (!llmProvider) {
    return summary;
  }

  const prompt = [
    'Rewrite the following list of database schema changes as a short, clear',
    'explanation of their impact for a developer reviewing this migration.',
    'Do not invent any change that is not listed below.',
    '',
    summary
  ].join('\n');

  return llmProvider.generate(prompt);
}
