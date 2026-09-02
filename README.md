<h1 align="center">SQL Schema Copilot</h1>

<p align="center">
  <em>Ask your schema, not your data. <strong>No live database, no network by default, no data leaves your machine.</strong></em>
</p>

<p align="center">
  <a href="https://github.com/aflinrinosha2004/sql-schema-copilot/actions/workflows/test.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/aflinrinosha2004/sql-schema-copilot/test.yml?style=flat-square&label=CI&color=007ACC" alt="CI">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License">
  </a>
  <a href="#contributing">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome">
  </a>
  <a href="#-mcp-server">
    <img src="https://img.shields.io/badge/MCP-server%20included-blueviolet?style=flat-square" alt="MCP server included">
  </a>
</p>

---

A Visual Studio Code extension that lets you ask questions about your SQL schema and migration
files directly inside the editor — as a chat participant, a right-click command, or a standalone
MCP server for other AI tools. It reads only the `.sql` files already in your workspace: **no live
database connection, no credentials, and no schema data leaves your machine unless you explicitly
turn on a cloud model.**

---

## Table of Contents

- [About](#about)
- [Why This Extension](#why-this-extension)
- [Meet Schema](#meet-schema)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Commands](#commands)
- [Settings](#settings)
- [How It Works](#how-it-works)
- [MCP Server](#mcp-server)
- [Build From Source](#build-from-source)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)
- [Acknowledgments](#acknowledgments)
- [Contact Us](#contact-us)

---

## About

You open a codebase you didn't build, or a migration someone else wrote, and you need to know:
what does this table connect to, what does this column mean, what breaks if I change it. SQL
Schema Copilot answers that from the `.sql` files already in your workspace — no need to spin up
the database, request credentials, or wait for whoever wrote the migration to explain it.

It watches your schema folder, chunks every table into retrievable context, embeds that context
locally, and answers questions grounded in exactly what your files say — nothing invented, nothing
fetched from a live connection.

---

## Why This Extension

Most "chat with your database" tools solve a different problem: connect to a **live** database and
ask analytics questions about the **data** inside it. That space is already crowded — Microsoft
ships schema-aware Copilot chat natively for SQL Server and PostgreSQL, and open-source engines
like Vanna.ai already do live-database Q&A well.

What none of them cover is the narrower, file-only case: understanding **structure**, not data,
with no live connection at all.

| Need | Live-DB chat tools | SQL Schema Copilot |
| :--- | :---: | :---: |
| Onboard onto a schema you didn't design | Requires DB credentials | Reads the `.sql` files only |
| Review a migration before merging it | Not their focus | `Explain this schema file`, migration diff |
| Generate types/ORM models from schema | Not their focus | Built in |
| Works with no database running | No | Yes |
| Schema/data ever leaves your machine | Depends on the tool | Never, unless you opt into a cloud key |

> **This isn't a smaller version of a live-database chatbot. It solves a task those tools don't
> attempt: understanding schema from files alone.**

---

## Meet Schema

Every answer inside VS Code comes from **Schema** — the persona behind the `@sqlschema` chat
participant. Schema has one job and stays honest about its limits:

- Answers **only** from the `.sql` files it has indexed — never a live database, never invented columns
- Always names the specific table(s) or column(s) an answer is about, and cites the source file and line
- Says "that's not in your schema" instead of guessing when the context doesn't contain the answer
- Keeps answers short — you're mid-task in an editor, not reading a report

Say hello with `@sqlschema` in Copilot Chat and ask anything about your indexed schema.

---

## Features

### Core Engine (Local RAG Pipeline)
- Schema chunking — one chunk per table, with foreign-key relationships stored as metadata
- Local embeddings by default (dependency-free hashing provider, zero install, zero network)
- Optional richer embeddings via `transformers.js`, opt-in and lazy-loaded
- A lightweight local vector index with disk-backed caching
- Pluggable LLM providers — local **Ollama** by default, or bring-your-own-key **Anthropic**/**OpenAI**
- Incremental re-indexing on file create, change, and delete

### Chat, Commands & Settings
- `@sqlschema` chat participant inside Copilot Chat, with follow-up suggestions
- Right-click **Explain this schema file** on any `.sql` file
- Settings for provider, cloud provider kind, embedding method, and schema folder path
- Cloud API keys stored via VS Code SecretStorage — never in `settings.json`

### Beyond the MVP
- **Migration diff** — compare two schema snapshots and get a plain-English summary of what changed and what it breaks
- **Type generation** — turn a parsed schema into TypeScript interfaces
- **Relationship graph** — the full foreign-key graph across your schema, exportable as Graphviz DOT
- **MCP server** — the same engine, exposed to Cursor, Windsurf, Claude Code, or any MCP client, outside VS Code entirely

### Tested, Not Just Written
- Unit tests for every engine module — chunking, both embedding paths, the vector store, migration diff, type generation, the relationship graph, and the engine itself — runnable without the VS Code test host
- VS Code integration tests via `@vscode/test-electron`
- GitHub Actions CI on every push and pull request

---

## Installation

SQL Schema Copilot is not yet published to the VS Code Marketplace. Until then, install it from
source or from a packaged `.vsix`.

### From a `.vsix` file

```bash
# Build the .vsix yourself (see Build From Source), then:
code --install-extension sql-schema-copilot-0.1.0.vsix
```

### From source (Extension Development Host)

```bash
git clone https://github.com/aflinrinosha2004/sql-schema-copilot.git
cd sql-schema-copilot
npm install
npm run compile
# Press F5 in VS Code to launch the Extension Development Host
```

---

## Usage

1. Open a workspace that has a `schema` folder (or set `sqlSchemaCopilot.schemaFolderPath`)
   containing `.sql` files
2. Open Copilot Chat and type `@sqlschema explain the orders table`
3. Or right-click any `.sql` file → **Explain this schema file**
4. Keep asking — Schema re-indexes automatically whenever a schema file changes

By default, answers are generated by a local Ollama instance. To use a cloud model instead:

```bash
Ctrl+Shift+P → SQL Schema Copilot: Set Cloud API Key
```

then set `sqlSchemaCopilot.provider` to `cloud` and `sqlSchemaCopilot.cloudProviderKind` to
`anthropic` or `openai`.

---

## Commands

| Command | What it does |
| :--- | :--- |
| `SQL Schema Copilot: Explain this schema file` | Summarizes and explains the table(s) in the selected `.sql` file |
| `SQL Schema Copilot: Set Cloud API Key` | Stores a cloud provider API key securely in SecretStorage |
| `@sqlschema <question>` | Ask Schema anything about your indexed tables, in Copilot Chat |

---

## Settings

| Setting | Default | Description |
| :--- | :--- | :--- |
| `sqlSchemaCopilot.provider` | `local` | `local` (Ollama) or `cloud` (bring-your-own-key) |
| `sqlSchemaCopilot.cloudProviderKind` | `anthropic` | `anthropic` or `openai`, used when `provider` is `cloud` |
| `sqlSchemaCopilot.embeddingProvider` | `hashing` | `hashing` (default, no extra install) or `transformers-js` (richer, requires `npm install @xenova/transformers`) |
| `sqlSchemaCopilot.schemaFolderPath` | `schema` | Relative path to the folder containing schema files |
| `sqlSchemaCopilot.cloudApiKey` | *(empty)* | Stored via SecretStorage. Do not edit this in `settings.json` |

---

## How It Works

```
.sql files
  │
  ├─▶ 1. WATCH     detect create/change/delete under the schema folder
  ├─▶ 2. PARSE     node-sql-parser → tables, columns, types, foreign keys
  ├─▶ 3. CHUNK     one chunk per table, related tables attached as metadata
  ├─▶ 4. EMBED     local embedding (hashing, or transformers.js if enabled)
  ├─▶ 5. INDEX     local vector store, cached to disk, updated incrementally
  ├─▶ 6. RETRIEVE  question → embedding → top-k matching chunks
  ├─▶ 7. GROUND    chunks + question → a prompt Schema can only answer from
  └─▶ 8. ANSWER    local Ollama or your own cloud key, streamed into chat
```

Nothing in steps 1–6 ever leaves your machine. Only step 8 can reach the network, and only if you
have explicitly configured a cloud provider.

---

## MCP Server

The same engine that powers the VS Code chat participant is also available as a standalone
[Model Context Protocol](https://modelcontextprotocol.io) server, so any MCP-compatible client —
Cursor, Windsurf, Claude Code — can ask it the same questions.

```bash
npm run mcp:start -- <path-to-schema-folder>
```

This exposes two tools:

| Tool | Arguments | Returns |
| :--- | :--- | :--- |
| `askQuestion` | `question: string` | A grounded answer with source citations |
| `explainFile` | `filePath: string` | An explanation of the table(s) in that file |

---

## Build From Source

```bash
# 1. Clone
git clone https://github.com/aflinrinosha2004/sql-schema-copilot.git
cd sql-schema-copilot

# 2. Install dependencies
npm install

# 3. Build (esbuild, bundles the extension, the MCP server, and the tests)
npm run compile

# 4. Run the engine unit tests (no VS Code host required)
npm run test:unit

# 5. Run the full suite, including VS Code integration tests
npm test

# 6. Launch the Extension Development Host
#    Press F5 in VS Code
```

| Script | Purpose |
| :--- | :--- |
| `npm run compile` | Production build via esbuild |
| `npm run watch` | Rebuild on save |
| `npm run test:unit` | Engine unit tests only, no VS Code host |
| `npm test` | Full suite, including VS Code integration tests |
| `npm run mcp:start -- <folder>` | Run the standalone MCP server against a schema folder |

---

## Contributing

Contributions are welcome — especially additional SQL dialect support, new chat follow-ups, and
more engine test coverage.

1. Fork the repository and create a feature branch
2. Keep the shared contract in mind: the parsing layer produces `ParsedSchema`, the engine
   implements `SchemaEngine` (`explainFile`, `askQuestion`) — changes to either shape affect both sides
3. Add or update tests under `src/test/suite/`
4. Run `npm run compile && npm run test:unit` before opening a pull request

---

## Roadmap

- [ ] Additional SQL dialect support (MySQL, SQLite, SQL Server syntax variants)
- [ ] Multi-file relationship graph rendered visually in a webview
- [ ] Chat commands for migration diff and type generation directly from `@sqlschema`
- [ ] VS Code Marketplace publish

Have a request? [Open an issue](https://github.com/aflinrinosha2004/sql-schema-copilot/issues).

---

## License

This project is released under the **MIT License**. You are free to use, modify, and distribute
it under the terms of this license. See the [LICENSE](LICENSE) file for the full text.

---

## Acknowledgments

Built with these open-source projects:

- [node-sql-parser](https://github.com/taozhi8833998/node-sql-parser) — parses SQL DDL into a structured AST
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk) — powers the standalone MCP server
- [esbuild](https://github.com/evanw/esbuild) — bundles the extension, tests, and MCP server
- [VS Code Extension API](https://code.visualstudio.com/api) — the Chat Participant API that gives Schema a home in Copilot Chat

---

## Contact Us

If you have any questions, feedback, or suggestions, feel free to reach out to the authors:

* **Aflin Rinosha S**: I will let you know soon
* **Anand Sundaramoorthy SA**: [sanand03072005@gmail.com](mailto:sanand03072005@gmail.com?subject=Question%20about%20SQL%20Schema%20Copilot&body=Dear%20Authors%2C%0A%0AI%20have%20a%20question%20regarding%20the%20SQL%20Schema%20Copilot%20VS%20Code%20extension%2E%0A%0A%5BYour%20Question%20Here%5D%0A%0AThank%20you%21%0A%5BYour%20Name%5D)

---

<p align="center">
  <a href="https://github.com/aflinrinosha2004/sql-schema-copilot">GitHub</a> ·
  <a href="https://github.com/aflinrinosha2004/sql-schema-copilot/issues">Issues</a>
</p>
