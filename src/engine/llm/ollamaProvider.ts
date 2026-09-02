import { LlmProvider } from './llmProvider';

/**
 * Calls a locally running Ollama instance. This is the default "local"
 * provider: no data leaves the machine, and no API key is required.
 */
export class OllamaProvider implements LlmProvider {
  public readonly name = 'ollama-local';

  constructor(
    private readonly model = 'llama3',
    private readonly baseUrl = 'http://localhost:11434'
  ) {}

  public async generate(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, prompt, stream: false })
    });

    if (!response.ok) {
      throw new Error(
        `Ollama request failed (${response.status}). Is Ollama running locally at ${this.baseUrl}?`
      );
    }

    const data = (await response.json()) as { response?: string };
    return data.response ?? '';
  }
}
