import * as fs from 'fs';
import * as path from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { parseSchemaSql, ParsedSchema, TableDefinition } from '../sql/parser';
import { RealSchemaEngine } from '../engine/schemaEngine';
import { HashingEmbeddingProvider } from '../engine/embeddings/hashingEmbeddingProvider';
import { OllamaProvider } from '../engine/llm/ollamaProvider';

/**
 * Standalone MCP server exposing the same local, file-based schema engine
 * used by the VS Code extension - so other MCP-compatible tools (Claude Code,
 * Cursor, Windsurf) can ask the same questions about a schema folder without
 * a live database connection.
 *
 * Usage: node out/mcp/server.js <path-to-schema-folder>
 */

function findSqlFilesSync(rootDir: string): string[] {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const results: string[] = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && fullPath.toLowerCase().endsWith('.sql')) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

function loadSchemaFromFolder(rootDir: string): ParsedSchema {
  const tables: TableDefinition[] = [];
  for (const filePath of findSqlFilesSync(rootDir)) {
    const text = fs.readFileSync(filePath, 'utf8');
    const parsed = parseSchemaSql(text, filePath, 1);
    tables.push(...parsed.tables);
  }
  return { tables };
}

async function main(): Promise<void> {
  const schemaFolder = path.resolve(process.argv[2] ?? process.cwd());

  const engine = new RealSchemaEngine({
    embeddingProvider: new HashingEmbeddingProvider(),
    llmProvider: new OllamaProvider()
  });

  await engine.indexSchema(loadSchemaFromFolder(schemaFolder));

  const server = new McpServer({ name: 'sql-schema-copilot', version: '0.1.0' });

  server.registerTool(
    'askQuestion',
    {
      title: 'Ask a question about the indexed SQL schema',
      description: 'Answers a natural-language question grounded in the schema files under the configured folder.',
      inputSchema: { question: z.string() }
    },
    async ({ question }) => ({
      content: [{ type: 'text', text: await engine.askQuestion(question) }]
    })
  );

  server.registerTool(
    'explainFile',
    {
      title: 'Explain a specific schema file',
      description: 'Explains the table(s) defined in a given .sql file path.',
      inputSchema: { filePath: z.string() }
    },
    async ({ filePath }) => ({
      content: [{ type: 'text', text: await engine.explainFile(filePath) }]
    })
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Failed to start SQL Schema Copilot MCP server:', error);
  process.exit(1);
});
