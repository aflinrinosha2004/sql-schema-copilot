# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

- Added the core local RAG engine: chunking, a dependency-free hashing embedding provider (with an optional `transformers.js` provider), a local vector index, and pluggable LLM providers (Ollama by default, Anthropic/OpenAI BYOK).
- Wired the real `RealSchemaEngine` into extension activation, replacing the placeholder, with incremental re-indexing on file create/change/delete.
- Added the `@sqlschema` chat participant inside Copilot Chat.
- Added Phase 2 features: migration diff explanation, TypeScript interface generation, and a cross-table relationship graph.
- Added Phase 3: a standalone MCP server exposing the same engine outside VS Code.
- Added unit tests for every new engine module, runnable without the VS Code test host.
- Introduced "Schema", the named persona behind the `@sqlschema` chat participant, with a shared persona preamble used in every grounded prompt, a warmer greeting, and follow-up suggestions.
- Rewrote README.md with a full flow: About, Why This Extension, Meet Schema, Features, Installation, Usage, Commands, Settings, How It Works, MCP Server, Build From Source, Contributing, Roadmap, License, Acknowledgments, and Contact Us.

## [0.1.0] - 2026-09-02

- Initial scaffold for the SQL Schema Copilot VS Code extension.
- Added schema file watcher and SQL parsing wrapper scaffolding.
- Added placeholder engine and command registrations.
- Added test harness and CI workflow.
