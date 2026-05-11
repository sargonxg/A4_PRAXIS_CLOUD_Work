export type AskSlashCommand = 'research' | 'memo' | 'brief' | 'ach' | 'scenarios' | 'cite' | 'refresh';

export interface ParsedAskCommand {
  command: AskSlashCommand | null;
  methodMention: string | null;
  text: string;
}

const COMMANDS: AskSlashCommand[] = ['research', 'memo', 'brief', 'ach', 'scenarios', 'cite', 'refresh'];

export function parseAskCommand(input: string): ParsedAskCommand {
  const trimmed = input.trim();
  const commandMatch = trimmed.match(/^\/([a-z-]+)\b/i);
  const mentionMatch = trimmed.match(/@([a-z0-9-]+)/i);
  const command = commandMatch && COMMANDS.includes(commandMatch[1].toLowerCase() as AskSlashCommand)
    ? commandMatch[1].toLowerCase() as AskSlashCommand
    : null;

  return {
    command,
    methodMention: mentionMatch?.[1] ?? null,
    text: command ? trimmed.replace(commandMatch?.[0] ?? '', '').trim() : trimmed,
  };
}

export function commandToMode(command: AskSlashCommand | null): AskMode | null {
  if (!command) return null;
  if (command === 'research' || command === 'refresh' || command === 'cite') return 'research';
  if (command === 'memo' || command === 'brief') return 'memo';
  if (command === 'ach') return 'deep';
  if (command === 'scenarios') return 'scenario';
  return null;
}

export type AskMode = 'quick' | 'deep' | 'research' | 'memo' | 'scenario' | 'auto';
