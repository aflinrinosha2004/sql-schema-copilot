import { ParsedSchema, ColumnDefinition } from '../../sql/parser';

function toPascalCase(name: string): string {
  return name
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function mapSqlTypeToTs(sqlType: string): string {
  const type = sqlType.toLowerCase();

  if (/(int|serial|number|numeric|decimal|float|double|real)/.test(type)) {
    return 'number';
  }
  if (/(bool)/.test(type)) {
    return 'boolean';
  }
  if (/(char|text|uuid|date|time)/.test(type)) {
    return 'string';
  }
  if (/(json)/.test(type)) {
    return 'Record<string, unknown>';
  }
  return 'unknown';
}

function renderField(column: ColumnDefinition): string {
  const tsType = mapSqlTypeToTs(column.type);
  const optional = column.nullable && !column.isPrimaryKey ? ' | null' : '';
  return `  ${column.name}: ${tsType}${optional};`;
}

export function generateTypeScriptInterfaces(schema: ParsedSchema): string {
  const blocks = schema.tables.map((table) => {
    const fields = table.columns.map(renderField).join('\n');
    return [`export interface ${toPascalCase(table.name)} {`, fields, '}'].join('\n');
  });

  return blocks.join('\n\n');
}
