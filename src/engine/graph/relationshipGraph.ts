import { ParsedSchema } from '../../sql/parser';

export interface RelationshipEdge {
  from: string;
  to: string;
  via: string;
}

export class RelationshipGraph {
  private readonly edges: RelationshipEdge[] = [];
  private readonly adjacency = new Map<string, Set<string>>();

  constructor(schema: ParsedSchema) {
    for (const table of schema.tables) {
      for (const fk of table.foreignKeys) {
        this.edges.push({ from: table.name, to: fk.referencesTable, via: fk.column });
        this.link(table.name, fk.referencesTable);
        this.link(fk.referencesTable, table.name);
      }
    }
  }

  private link(a: string, b: string): void {
    const set = this.adjacency.get(a) ?? new Set<string>();
    set.add(b);
    this.adjacency.set(a, set);
  }

  public getRelatedTables(tableName: string): string[] {
    return Array.from(this.adjacency.get(tableName) ?? []);
  }

  public getAllEdges(): RelationshipEdge[] {
    return [...this.edges];
  }

  /** Renders the graph as Graphviz DOT, for optional visualization. */
  public toDot(): string {
    const lines = this.edges.map((edge) => `  "${edge.from}" -> "${edge.to}" [label="${edge.via}"];`);
    return ['digraph schema {', ...lines, '}'].join('\n');
  }
}
