import * as assert from 'assert';
import * as vscode from 'vscode';
import { findSchemaFiles, watchSchemaFiles } from '../../schema/schemaWatcher';

describe('Schema file watcher', () => {
  // The test workspace (with schema/migration/users.sql already in it) is
  // created and opened as a launch argument by runTest.ts, so it is already
  // available here - no need to add it at runtime.

  it('finds sql files under schema folders', async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'expected an open workspace');

    const files = await findSchemaFiles(workspaceFolder.uri, 'schema');
    assert.ok(Array.isArray(files));
    assert.ok(files.some((file) => file.fsPath.endsWith('.sql')));
  });

  it('creates a watcher for schema files', () => {
    const watcher = watchSchemaFiles();
    assert.ok(watcher);
    assert.strictEqual(typeof watcher.dispose, 'function');
    watcher.dispose();
  });
});
