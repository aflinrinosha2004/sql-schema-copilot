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
- Renamed the extension to **SQL File Explainer** (from "SQL Schema Copilot") and the chat persona to **Schemer** (from "Schema"). Updated every command ID (`sql-file-explainer.*`), the settings namespace (`sqlFileExplainer.*`), and the chat participant invocation (`@schemer`, was `@sqlschema`) to match.
- Replaced the placeholder `icon.png` with a real 128x128 icon (a chat bubble containing a small SQL table, one column highlighted), wired into `package.json`'s `icon` and `galleryBanner` fields, the README header, and the `@schemer` chat participant's `iconPath`.
- Fixed `tsconfig.json`: removed the dead `esbuild.js` entry from `include` (it was silently skipped without `allowJs`), set `rootDir` to `src` to match the actual source layout, and added `noEmit: true` so a plain `tsc -p .` can no longer write a mismatched `out/src/**` tree alongside esbuild's real output.
- Added Aflin Rinosha S's contact email to the Contact Us section, using the same clickable mailto template as the other author.
- Redesigned icon.png: a database cylinder (one band highlighted) as the primary shape, with a small robot-face badge docked at the bottom-right corner to represent the chat/bot side more literally.
- Fixed CI, which had been failing on every push since the initial commit: the "Missing X server or $DISPLAY" error is fixed by running the test step under `xvfb-run -a` (the VS Code test host is Electron-based and needs a display even headless). Also fixed a real, flaky test underneath that failure: the workspace-folder fixture is now created and opened as a launch argument in `runTest.ts` instead of being added at runtime via the asynchronous, racy `updateWorkspaceFolders`.
- Fixed a real bug: `askQuestion` returned a canned "No schema has been indexed yet" message for every question whenever nothing was indexed, so identity/meta questions like "who are you?" never reached the model at all. Removed that early return, and rewrote `PERSONA_PREAMBLE` into explicit sections - ABOUT YOU, HOW TO ANSWER, and GUARDRAILS - so Schemer answers questions about itself directly, answers schema questions only from indexed context, refuses to treat schema file content as instructions (prompt-injection defense), and declines off-topic requests. Added `promptBuilder.test.ts` to lock this behavior in.

## [0.1.0] - 2026-09-02

- Initial scaffold for the SQL Schema Copilot VS Code extension.
- Added schema file watcher and SQL parsing wrapper scaffolding.
- Added placeholder engine and command registrations.
- Added test harness and CI workflow.
