import { EmbeddingProvider } from './embeddingProvider';

/**
 * Optional, higher-quality local embedding provider using transformers.js
 * (all-MiniLM-L6-v2 via ONNX runtime). It still runs entirely on-device -
 * the model is downloaded once from Hugging Face on first use and cached
 * locally by transformers.js, no schema content is ever sent anywhere.
 *
 * This package is intentionally NOT a hard dependency of the extension: it
 * is loaded lazily so the extension works fully offline out of the box via
 * HashingEmbeddingProvider. Users who want richer semantic search can run
 * `npm install @xenova/transformers` and select this provider.
 */
export class TransformersEmbeddingProvider implements EmbeddingProvider {
  public readonly name = 'transformers-js-local';
  public readonly dimensions = 384;

  private pipelinePromise?: Promise<(text: string) => Promise<number[]>>;

  constructor(private readonly modelId = 'Xenova/all-MiniLM-L6-v2') {}

  public async embed(text: string): Promise<number[]> {
    const run = await this.getPipeline();
    return run(text);
  }

  public async embedBatch(texts: string[]): Promise<number[][]> {
    const run = await this.getPipeline();
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await run(text));
    }
    return results;
  }

  private getPipeline(): Promise<(text: string) => Promise<number[]>> {
    if (!this.pipelinePromise) {
      this.pipelinePromise = this.loadPipeline();
    }
    return this.pipelinePromise;
  }

  private async loadPipeline(): Promise<(text: string) => Promise<number[]>> {
    let transformers: any;
    try {
      // Optional dependency: not installed by default, resolved only at
      // runtime if the user has run `npm install @xenova/transformers`.
      // @ts-expect-error - no type declarations are available unless installed
      transformers = await import('@xenova/transformers');
    } catch {
      throw new Error(
        'TransformersEmbeddingProvider requires the optional "@xenova/transformers" package. ' +
          'Run "npm install @xenova/transformers" to enable richer local embeddings, or use ' +
          'HashingEmbeddingProvider (the default) which needs no extra install.'
      );
    }

    const extractor = await transformers.pipeline('feature-extraction', this.modelId);

    return async (text: string) => {
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data as Float32Array);
    };
  }
}
