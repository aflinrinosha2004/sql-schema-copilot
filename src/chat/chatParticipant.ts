import * as vscode from 'vscode';
import { SchemaEngine } from '../engine/schemaEngine';

export const CHAT_PARTICIPANT_ID = 'sql-schema-copilot.sqlschema';

export function registerChatParticipant(
  context: vscode.ExtensionContext,
  getEngine: () => SchemaEngine
): vscode.ChatParticipant {
  const participant = vscode.chat.createChatParticipant(
    CHAT_PARTICIPANT_ID,
    async (request, _context, stream, _token) => {
      const question = request.prompt.trim();

      if (!question) {
        stream.markdown('Ask a question about your SQL schema, for example: `explain the orders table`.');
        return;
      }

      stream.progress('Searching indexed schema...');

      try {
        const answer = await getEngine().askQuestion(question);
        stream.markdown(answer);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        stream.markdown(`Could not answer that question: ${message}`);
      }
    }
  );

  participant.iconPath = new vscode.ThemeIcon('database');
  context.subscriptions.push(participant);
  return participant;
}
