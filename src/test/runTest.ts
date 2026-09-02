import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

/**
 * Creates a throwaway workspace folder with a schema fixture already in
 * place, so VS Code opens it directly on launch. Adding a folder to an
 * already-running, no-workspace instance via updateWorkspaceFolders is
 * asynchronous and races the test suite; opening it as a launch argument
 * avoids that entirely.
 */
function createFixtureWorkspace(): string {
  const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sql-file-explainer-workspace-'));
  const schemaDir = path.join(workspaceDir, 'schema', 'migration');
  fs.mkdirSync(schemaDir, { recursive: true });
  fs.writeFileSync(path.join(schemaDir, 'users.sql'), 'CREATE TABLE users (id INT);');
  return workspaceDir;
}

async function main(): Promise<void> {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '..', '..');
    const extensionTestsPath = path.resolve(__dirname, 'suite', 'index');
    const fixtureWorkspace = createFixtureWorkspace();

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [fixtureWorkspace]
    });
  } catch (error) {
    console.error('Failed to run tests:', error);
    process.exit(1);
  }
}

main();
