export interface LlmProvider {
  readonly name: string;
  generate(prompt: string): Promise<string>;
}
