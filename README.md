# SQL Schema Copilot

SQL Schema Copilot is a fully local, file-based SQL schema and migration assistant for VS Code. It watches `.sql` files under a configured schema folder, indexes them with local embeddings, and answers questions about them through a chat participant, a right-click command, or a standalone MCP server - all without a live database connection, and without schema data leaving your machine unless you explicitly opt into a cloud model.

## Included

**Extension scaffolding**
- Extension activation and command registration
- Schema folder watcher for `.sql` files under `schema/**`
- SQL parsing wrapper using `node-sql-parser`
- Provider and schema-folder settings, SecretStorage-backed cloud API key handling
- Command palette and right-click support

**Core engine (local RAG pipeline)**
- Schema chunking (one chunk per table, with foreign-key relationships as metadata)
- Local embeddings by default (dependency-free hashing provider), with an optional richer `transformers.js` provider
- A lightweight local vector index with disk-backed caching
- Pluggable LLM providers: local Ollama by default, or bring-your-own-key Anthropic/OpenAI
- `@sqlschema` chat participant inside VS Code's Copilot Chat
- Incremental re-indexing on file create/change/delete

**Phase 2 - extended workflow**
- Migration diff explanation between two schema snapshots
- TypeScript interface generation from schema
- A relationship graph across all tables (with Graphviz DOT export)

**Phase 3 - beyond VS Code**
- The same engine exposed as a standalone MCP server, usable from Cursor, Windsurf, and Claude Code

**Testing**
- Mocha unit tests for every engine module (parser, chunking, embeddings, vector store, migration diff, type generation, relationship graph, and the engine itself) that run without the VS Code host
- VS Code integration tests via `@vscode/test-electron`
- GitHub Actions workflow

## Commands

- `SQL Schema Copilot: Explain this schema file`
- `SQL Schema Copilot: Set Cloud API Key`
- Chat: `@sqlschema <question>` inside Copilot Chat

## Settings

- `sqlSchemaCopilot.provider`: `local` (Ollama) or `cloud` (bring-your-own-key)
- `sqlSchemaCopilot.cloudProviderKind`: `anthropic` or `openai`, used when `provider` is `cloud`
- `sqlSchemaCopilot.embeddingProvider`: `hashing` (default, no extra install) or `transformers-js` (richer, requires `npm install @xenova/transformers`)
- `sqlSchemaCopilot.schemaFolderPath`: relative folder path, for example `schema` or `schema/migration`
- `sqlSchemaCopilot.cloudApiKey`: stored securely via SecretStorage and not kept in `settings.json`

## MCP server

```bash
npm run mcp:start -- <path-to-schema-folder>
```

Exposes `askQuestion` and `explainFile` as MCP tools, so any MCP-compatible client can query the same local schema engine used by the VS Code extension.

## Development

```bash
npm install
npm run test:unit   # engine unit tests, no VS Code host required
npm test            # full suite, including VS Code integration tests
```
