import * as vscode from 'vscode';
import { findSchemaFiles, watchSchemaFiles } from './schema/schemaWatcher';
import { parseSchemaSql, ParsedSchema } from './sql/parser';
import { RealSchemaEngine, SchemaEngine } from './engine/schemaEngine';
import { EmbeddingProvider } from './engine/embeddings/embeddingProvider';
import { HashingEmbeddingProvider } from './engine/embeddings/hashingEmbeddingProvider';
import { TransformersEmbeddingProvider } from './engine/embeddings/transformersEmbeddingProvider';
import { LlmProvider } from './engine/llm/llmProvider';
import { OllamaProvider } from './engine/llm/ollamaProvider';
import { createByokProvider, CloudProviderKind } from './engine/llm/byokProvider';
import { registerChatParticipant } from './chat/chatParticipant';

class PlaceholderSchemaEngine implements SchemaEngine {
  async explainFile(uri: string): Promise<string> {
    return `Schema explanation for ${uri} is not implemented yet.`;
  }

  async askQuestion(question: string): Promise<string> {
    return `Question received: ${question}`;
  }
}

function createEmbeddingProvider(config: vscode.WorkspaceConfiguration): EmbeddingProvider {
  const choice = config.get<string>('embeddingProvider', 'hashing');
  return choice === 'transformers-js' ? new TransformersEmbeddingProvider() : new HashingEmbeddingProvider();
}

async function createLlmProvider(
  config: vscode.WorkspaceConfiguration,
  secrets: vscode.SecretStorage
): Promise<LlmProvider> {
  const providerChoice = config.get<string>('provider', 'local');

  if (providerChoice === 'cloud') {
    const apiKey = await secrets.get('sqlFileExplainer.cloudApiKey');
    if (!apiKey) {
      vscode.window.showWarningMessage(
        'SQL File Explainer: cloud provider selected but no API key is set. Run "Set Cloud API Key" first. Falling back to local.'
      );
    } else {
      const kind = config.get<CloudProviderKind>('cloudProviderKind', 'anthropic');
      return createByokProvider(kind, apiKey);
    }
  }

  return new OllamaProvider();
}

export class SqlFileExplainerExtension {
  private engine: SchemaEngine;
  private readonly watchedFiles = new Set<string>();
  private watcher?: vscode.FileSystemWatcher;

  public constructor(engine: SchemaEngine = new PlaceholderSchemaEngine()) {
    this.engine = engine;
  }

  public activate(context: vscode.ExtensionContext): void {
    this.watcher = watchSchemaFiles();

    this.watcher.onDidCreate((uri) => void this.handleFileChanged(uri));
    this.watcher.onDidChange((uri) => void this.handleFileChanged(uri));
    this.watcher.onDidDelete((uri) => void this.handleFileDeleted(uri));

    const config = vscode.workspace.getConfiguration('sqlFileExplainer');
    const schemaFolderPath = config.get<string>('schemaFolderPath', 'schema');

    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      void findSchemaFiles(folder.uri, schemaFolderPath).then((uris) => {
        uris.forEach((uri) => this.registerSchemaFile(uri));
      });
    }

    void context.secrets.get('sqlFileExplainer.cloudApiKey').then((secret) => {
      if (secret) {
        void vscode.window.setStatusBarMessage('SQL File Explainer: cloud key configured', 2000);
      }
    });

    const explainCommand = vscode.commands.registerCommand('sql-file-explainer.explainSchemaFile', async (uri?: vscode.Uri) => {
      const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;
      if (!targetUri || !targetUri.fsPath.endsWith('.sql')) {
        vscode.window.showWarningMessage('Select a .sql file to explain.');
        return;
      }

      const content = await vscode.workspace.fs.readFile(targetUri);
      const text = Buffer.from(content).toString('utf8');
      const parsed = parseSchemaSql(text, targetUri.fsPath, 1);
      await this.engine_reindexFile(parsed, targetUri.fsPath);

      const explanation = await this.engine.explainFile(targetUri.fsPath);
      const tableSummary = parsed.tables.map((table) => `- ${table.name}: ${table.columns.length} columns`).join('\n');

      vscode.window.showInformationMessage([
        `Schema summary for ${targetUri.fsPath}`,
        tableSummary || 'No tables found',
        '',
        explanation
      ].join('\n'));
    });

    const setCloudApiKeyCommand = vscode.commands.registerCommand('sql-file-explainer.setCloudApiKey', async () => {
      const key = await vscode.window.showInputBox({
        prompt: 'Enter your cloud API key',
        password: true,
        ignoreFocusOut: true
      });

      if (!key) {
        return;
      }

      await context.secrets.store('sqlFileExplainer.cloudApiKey', key);
      vscode.window.showInformationMessage('Cloud API key stored securely in VS Code SecretStorage.');
    });

    context.subscriptions.push(explainCommand, setCloudApiKeyCommand, this.watcher);

    registerChatParticipant(context, () => this.engine);
  }

  public setEngine(engine: SchemaEngine): void {
    this.engine = engine;
  }

  public deactivate(): void {
    this.watcher?.dispose();
  }

  private registerSchemaFile(uri: vscode.Uri): void {
    this.watchedFiles.add(uri.fsPath);
    void this.handleFileChanged(uri);
  }

  public getWatchedFiles(): string[] {
    return Array.from(this.watchedFiles);
  }

  private async handleFileChanged(uri: vscode.Uri): Promise<void> {
    this.watchedFiles.add(uri.fsPath);
    try {
      const content = await vscode.workspace.fs.readFile(uri);
      const text = Buffer.from(content).toString('utf8');
      const parsed = parseSchemaSql(text, uri.fsPath, 1);
      await this.engine_reindexFile(parsed, uri.fsPath);
    } catch {
      // Ignore transient read/parse errors (e.g. file mid-write); the next
      // save event will retry.
    }
  }

  private async handleFileDeleted(uri: vscode.Uri): Promise<void> {
    this.watchedFiles.delete(uri.fsPath);
    await this.engine_reindexFile({ tables: [] }, uri.fsPath);
  }

  private async engine_reindexFile(parsed: ParsedSchema, sourceFile: string): Promise<void> {
    if (this.engine instanceof RealSchemaEngine) {
      await this.engine.reindexFile(parsed, sourceFile);
    }
  }
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const config = vscode.workspace.getConfiguration('sqlFileExplainer');
  const embeddingProvider = createEmbeddingProvider(config);
  const llmProvider = await createLlmProvider(config, context.secrets);

  const engine = new RealSchemaEngine({
    embeddingProvider,
    llmProvider,
    cacheDir: `${context.storageUri?.fsPath ?? context.globalStorageUri.fsPath}/sql-assistant-cache`
  });

  const extension = new SqlFileExplainerExtension(engine);
  extension.activate(context);
  context.subscriptions.push({ dispose: () => extension.deactivate() });
}

export function deactivate(): void {
  // lifecycle hook kept for VS Code host compatibility
}
