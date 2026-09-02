import * as vscode from 'vscode';
import { SchemaEngine } from '../engine/schemaEngine';
import { PERSONA_NAME, GREETING } from '../engine/persona';

export const CHAT_PARTICIPANT_ID = 'sql-file-explainer.schemer';

export function registerChatParticipant(
  context: vscode.ExtensionContext,
  getEngine: () => SchemaEngine
): vscode.ChatParticipant {
  const participant = vscode.chat.createChatParticipant(
    CHAT_PARTICIPANT_ID,
    async (request, _context, stream, _token) => {
      const question = request.prompt.trim();

      if (!question) {
        stream.markdown(GREETING);
        return;
      }

      stream.progress(`${PERSONA_NAME} is checking your indexed schema...`);

      try {
        const answer = await getEngine().askQuestion(question);
        stream.markdown(answer);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        stream.markdown(`I couldn't answer that: ${message}`);
      }
    }
  );

  participant.iconPath = new vscode.ThemeIcon('database');
  participant.followupProvider = {
    provideFollowups: () => [
      { prompt: 'What tables reference this one?', label: 'Related tables' },
      { prompt: 'Generate TypeScript types for this table', label: 'Generate types' },
      { prompt: 'What changed in the last migration?', label: 'Latest migration' }
    ]
  };

  context.subscriptions.push(participant);
  return participant;
}
