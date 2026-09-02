import * as path from 'path';
import { ParsedSchema } from '../sql/parser';
import { chunkSchema, SchemaChunk } from './chunking';
import { normalizeSourcePath } from './pathUtils';
import { EmbeddingProvider } from './embeddings/embeddingProvider';
import { EmbeddingCache } from './embeddings/embeddingCache';
import { VectorStore, VectorRecord } from './index/vectorStore';
import { LlmProvider } from './llm/llmProvider';
import { buildGroundedPrompt, appendCitations } from './promptBuilder';

// Re-declared locally so this module has no compile-time dependency on
// extension.ts (or vscode); extension.ts assigns a RealSchemaEngine instance
// to a variable typed as its own SchemaEngine, and TypeScript's structural
// typing treats the two as interchangeable since the shapes are identical.
export interface SchemaEngine {
  explainFile(uri: string): Promise<string>;
  askQuestion(question: string): Promise<string>;
}

export interface SchemaEngineOptions {
  embeddingProvider: EmbeddingProvider;
  llmProvider: LlmProvider;
  cacheDir?: string;
  topK?: number;
}

export class RealSchemaEngine implements SchemaEngine {
  private readonly embeddingProvider: EmbeddingProvider;
  private readonly llmProvider: LlmProvider;
  private readonly cache?: EmbeddingCache;
  private readonly topK: number;
  private readonly store = new VectorStore();

  constructor(options: SchemaEngineOptions) {
    this.embeddingProvider = options.embeddingProvider;
    this.llmProvider = options.llmProvider;
    this.topK = options.topK ?? 5;
    this.cache = options.cacheDir ? new EmbeddingCache(options.cacheDir) : undefined;
  }

  public getIndexedChunkCount(): number {
    return this.store.size();
  }

  /** (Re)indexes every table found in the given schema. */
  public async indexSchema(schema: ParsedSchema): Promise<void> {
    const chunks = chunkSchema(schema);
    await this.indexChunks(chunks);
  }

  /** Replaces the indexed chunks for a single file (used on file save/change). */
  public async reindexFile(schema: ParsedSchema, sourceFile: string): Promise<void> {
    const normalized = normalizeSourcePath(sourceFile);
    this.store.removeBySourceFile(normalized);
    const chunks = chunkSchema(schema).filter((chunk) => chunk.sourceFile === normalized);
    await this.indexChunks(chunks);
  }

  public async explainFile(uri: string): Promise<string> {
    const normalized = normalizeUri(uri);
    const records = this.store.getBySourceFile(normalized);

    if (records.length === 0) {
      return `No indexed schema information was found for ${path.basename(normalized)}. ` +
        'Make sure it has been parsed as part of the configured schema folder.';
    }

    const chunks = records.map((record) => record.chunk);
    const prompt = buildGroundedPrompt(
      `Explain the purpose and structure of the table(s) defined in ${path.basename(normalized)}.`,
      chunks
    );

    const answer = await this.llmProvider.generate(prompt);
    return appendCitations(answer, chunks);
  }

  public async askQuestion(question: string): Promise<string> {
    // Deliberately no early return when nothing is indexed: the question
    // might not need schema at all (e.g. "who are you?"). The persona
    // preamble in the prompt below tells the model how to handle a schema
    // question when the context turns out to be empty.
    const questionVector = await this.embeddingProvider.embed(question);
    const results = this.store.query(questionVector, this.topK);
    const chunks = results.map((result) => result.record.chunk);

    const prompt = buildGroundedPrompt(question, chunks);
    const answer = await this.llmProvider.generate(prompt);
    return appendCitations(answer, chunks);
  }

  private async indexChunks(chunks: SchemaChunk[]): Promise<void> {
    for (const chunk of chunks) {
      const vector = await this.embed(chunk.text);
      const record: VectorRecord = { id: chunk.id, vector, chunk };
      this.store.upsert(record);
    }
    this.cache?.persist();
  }

  private async embed(text: string): Promise<number[]> {
    if (!this.cache) {
      return this.embeddingProvider.embed(text);
    }

    const key = EmbeddingCache.keyFor(this.embeddingProvider.name, text);
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const vector = await this.embeddingProvider.embed(text);
    this.cache.set(key, vector);
    return vector;
  }
}

function normalizeUri(uri: string): string {
  // Accept both a plain fsPath and a vscode.Uri#toString() value (file:///...).
  let decoded = uri;
  if (uri.startsWith('file://')) {
    decoded = decodeURIComponent(uri.replace('file://', ''));
    if (process.platform === 'win32' && decoded.startsWith('/')) {
      decoded = decoded.slice(1);
    }
  }
  return normalizeSourcePath(decoded);
}
