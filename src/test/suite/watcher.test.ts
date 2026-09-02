import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { findSchemaFiles, watchSchemaFiles } from '../../schema/schemaWatcher';

describe('Schema file watcher', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sql-file-explainer-'));

  before(async () => {
    const schemaDir = path.join(tempRoot, 'schema', 'migration');
    fs.mkdirSync(schemaDir, { recursive: true });
    fs.writeFileSync(path.join(schemaDir, 'users.sql'), 'CREATE TABLE users (id INT);');

    const workspaceFolder = vscode.Uri.file(tempRoot);
    const currentFolders = vscode.workspace.workspaceFolders ?? [];
    if (currentFolders.length === 0) {
      const added = vscode.workspace.updateWorkspaceFolders(0, 0, { uri: workspaceFolder, name: 'sql-file-explainer-test' });
      assert.strictEqual(added, true, 'expected workspace folder to be added');
    }
  });

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
