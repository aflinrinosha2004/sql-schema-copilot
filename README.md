# SQL Schema Copilot

SQL Schema Copilot is a VS Code extension scaffold for working with SQL schema files and migration folders. The extension watches for `.sql` files under the configured schema path, exposes their URIs, and provides a command entry point for later integration with a separate core engine.

## Included

- Extension activation and command registration
- Schema folder watcher for `.sql` files under `schema/**`
- SQL parsing wrapper using `node-sql-parser`
- Provider and schema-folder settings
- SecretStorage-backed cloud API key handling
- Command palette and right-click support
- Test harness with Mocha and VS Code integration tests
- GitHub Actions workflow

## Commands

- `SQL Schema Copilot: Explain this schema file`
- `SQL Schema Copilot: Set Cloud API Key`

## Settings

- `sqlSchemaCopilot.provider`: `local` or `cloud`
- `sqlSchemaCopilot.schemaFolderPath`: relative folder path, for example `schema` or `schema/migration`
- `sqlSchemaCopilot.cloudApiKey`: stored securely via SecretStorage and not kept in `settings.json`

## Development

```bash
npm install
npm test
```
