import { SchemaChunk } from './chunking';
import { PERSONA_PREAMBLE } from './persona';

export function buildGroundedPrompt(question: string, chunks: SchemaChunk[]): string {
  const context = chunks.length > 0
    ? chunks.map((chunk) => chunk.text).join('\n\n---\n\n')
    : '(no matching schema context was found)';

  return [
    PERSONA_PREAMBLE,
    '',
    '=== SCHEMA CONTEXT ===',
    context,
    '=== END SCHEMA CONTEXT ===',
    '',
    `Question: ${question}`
  ].join('\n');
}

export function appendCitations(answer: string, chunks: SchemaChunk[]): string {
  if (chunks.length === 0) {
    return answer;
  }

  const citations = chunks
    .map((chunk) => `- ${chunk.tableName} (${chunk.sourceFile}:${chunk.sourceLine})`)
    .join('\n');

  return `${answer}\n\nSources:\n${citations}`;
}
