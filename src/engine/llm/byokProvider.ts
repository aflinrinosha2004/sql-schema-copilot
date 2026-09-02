import { LlmProvider } from './llmProvider';

export type CloudProviderKind = 'anthropic' | 'openai';

/**
 * Calls a cloud LLM using an API key the user has explicitly supplied and
 * stored via VS Code SecretStorage. Only used when the user has opted into
 * "cloud" mode in settings - the default remains fully local (OllamaProvider).
 */
export class AnthropicProvider implements LlmProvider {
  public readonly name = 'anthropic-byok';

  constructor(
    private readonly apiKey: string,
    private readonly model = 'claude-3-5-sonnet-latest'
  ) {}

  public async generate(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed (${response.status}).`);
    }

    const data = (await response.json()) as { content?: Array<{ text?: string }> };
    return data.content?.[0]?.text ?? '';
  }
}

export class OpenAiProvider implements LlmProvider {
  public readonly name = 'openai-byok';

  constructor(
    private readonly apiKey: string,
    private readonly model = 'gpt-4o-mini'
  ) {}

  public async generate(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed (${response.status}).`);
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? '';
  }
}

export function createByokProvider(kind: CloudProviderKind, apiKey: string, model?: string): LlmProvider {
  return kind === 'openai' ? new OpenAiProvider(apiKey, model) : new AnthropicProvider(apiKey, model);
}
