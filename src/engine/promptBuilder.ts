import { SchemaChunk } from './chunking';

export function buildGroundedPrompt(question: string, chunks: SchemaChunk[]): string {
  const context = chunks.length > 0
    ? chunks.map((chunk) => chunk.text).join('\n\n---\n\n')
    : '(no matching schema context was found)';

  return [
    'You are a database schema assistant. Answer using ONLY the schema context below.',
    'If the answer is not contained in the context, say so explicitly instead of guessing.',
    'Cite the relevant table name(s) in your answer.',
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
