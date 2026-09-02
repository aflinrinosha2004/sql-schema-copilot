import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

class FallbackFileSystemWatcher implements vscode.FileSystemWatcher {
  public readonly onDidCreate: vscode.Event<vscode.Uri>;
  public readonly onDidChange: vscode.Event<vscode.Uri>;
  public readonly onDidDelete: vscode.Event<vscode.Uri>;
  public readonly ignoreCreateEvents: boolean = false;
  public readonly ignoreChangeEvents: boolean = false;
  public readonly ignoreDeleteEvents: boolean = false;

  constructor() {
    const createEmitter = new vscode.EventEmitter<vscode.Uri>();
    const changeEmitter = new vscode.EventEmitter<vscode.Uri>();
    const deleteEmitter = new vscode.EventEmitter<vscode.Uri>();

    this.onDidCreate = createEmitter.event;
    this.onDidChange = changeEmitter.event;
    this.onDidDelete = deleteEmitter.event;

    this.dispose = () => {
      createEmitter.dispose();
      changeEmitter.dispose();
      deleteEmitter.dispose();
    };
  }

  public dispose(): void {
    // overridden in constructor
  }
}

export async function findSchemaFiles(workspaceFolder: vscode.Uri, schemaFolderPath = 'schema'): Promise<vscode.Uri[]> {
  const root = workspaceFolder.fsPath;
  const schemaDir = path.resolve(root, schemaFolderPath);

  if (!fs.existsSync(schemaDir)) {
    return [];
  }

  const files: vscode.Uri[] = [];
  const stack = [schemaDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && fullPath.toLowerCase().endsWith('.sql')) {
        files.push(vscode.Uri.file(fullPath));
      }
    }
  }

  return files.sort((a, b) => a.fsPath.localeCompare(b.fsPath));
}

export function watchSchemaFiles(): vscode.FileSystemWatcher {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return new FallbackFileSystemWatcher();
  }

  const configPath = vscode.workspace.getConfiguration('sqlSchemaCopilot').get<string>('schemaFolderPath', 'schema');
  const globPattern = new vscode.RelativePattern(workspaceFolder, `${configPath}/**/*.sql`);
  return vscode.workspace.createFileSystemWatcher(globPattern);
}
