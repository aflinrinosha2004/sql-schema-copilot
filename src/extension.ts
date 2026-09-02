import * as vscode from 'vscode';
import { findSchemaFiles, watchSchemaFiles } from './schema/schemaWatcher';
import { parseSchemaSql } from './sql/parser';

export interface SchemaEngine {
  explainFile(uri: string): Promise<string>;
  askQuestion(question: string): Promise<string>;
}

class PlaceholderSchemaEngine implements SchemaEngine {
  async explainFile(uri: string): Promise<string> {
    return `Schema explanation for ${uri} is not implemented yet.`;
  }

  async askQuestion(question: string): Promise<string> {
    return `Question received: ${question}`;
  }
}

export class SqlSchemaCopilotExtension {
  private engine: SchemaEngine;
  private readonly watchedFiles = new Set<string>();
  private watcher?: vscode.FileSystemWatcher;

  public constructor(engine: SchemaEngine = new PlaceholderSchemaEngine()) {
    this.engine = engine;
  }

  public activate(context: vscode.ExtensionContext): void {
    this.watcher = watchSchemaFiles();

    this.watcher.onDidCreate((uri) => this.registerSchemaFile(uri));
    this.watcher.onDidChange((uri) => this.registerSchemaFile(uri));
    this.watcher.onDidDelete((uri) => this.watchedFiles.delete(uri.fsPath));

    const config = vscode.workspace.getConfiguration('sqlSchemaCopilot');
    const schemaFolderPath = config.get<string>('schemaFolderPath', 'schema');

    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      void findSchemaFiles(folder.uri, schemaFolderPath).then((uris) => {
        uris.forEach((uri) => this.registerSchemaFile(uri));
      });
    }

    void context.secrets.get('sqlSchemaCopilot.cloudApiKey').then((secret) => {
      if (secret) {
        void vscode.window.setStatusBarMessage('SQL Schema Copilot: cloud key configured', 2000);
      }
    });

    const explainCommand = vscode.commands.registerCommand('sql-schema-copilot.explainSchemaFile', async (uri?: vscode.Uri) => {
      const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;
      if (!targetUri || !targetUri.fsPath.endsWith('.sql')) {
        vscode.window.showWarningMessage('Select a .sql file to explain.');
        return;
      }

      const content = await vscode.workspace.fs.readFile(targetUri);
      const text = Buffer.from(content).toString('utf8');
      const parsed = parseSchemaSql(text, targetUri.fsPath, 1);
      const explanation = await this.engine.explainFile(targetUri.toString());
      const tableSummary = parsed.tables.map((table) => `- ${table.name}: ${table.columns.length} columns`).join('\n');

      vscode.window.showInformationMessage([
        `Schema summary for ${targetUri.fsPath}`,
        tableSummary || 'No tables found',
        '',
        explanation
      ].join('\n'));
    });

    const setCloudApiKeyCommand = vscode.commands.registerCommand('sql-schema-copilot.setCloudApiKey', async () => {
      const key = await vscode.window.showInputBox({
        prompt: 'Enter your cloud API key',
        password: true,
        ignoreFocusOut: true
      });

      if (!key) {
        return;
      }

      await context.secrets.store('sqlSchemaCopilot.cloudApiKey', key);
      vscode.window.showInformationMessage('Cloud API key stored securely in VS Code SecretStorage.');
    });

    context.subscriptions.push(explainCommand, setCloudApiKeyCommand, this.watcher);
  }

  public setEngine(engine: SchemaEngine): void {
    this.engine = engine;
  }

  public deactivate(): void {
    this.watcher?.dispose();
  }

  private registerSchemaFile(uri: vscode.Uri): void {
    this.watchedFiles.add(uri.fsPath);
  }

  public getWatchedFiles(): string[] {
    return Array.from(this.watchedFiles);
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const extension = new SqlSchemaCopilotExtension();
  extension.activate(context);
  context.subscriptions.push({ dispose: () => extension.deactivate() });
}

export function deactivate(): void {
  // lifecycle hook kept for VS Code host compatibility
}
