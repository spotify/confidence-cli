export type StreamEvent = {
  type: string;
  message?: {
    content?: Array<{ type: string; text?: string }>;
  };
  result?: string;
};

export function extractTextLines(event: StreamEvent): string[] {
  if (event.type === 'assistant' && event.message?.content) {
    return event.message.content
      .filter((b) => b.type === 'text' && b.text)
      .flatMap((b) => b.text!.split('\n'));
  }

  if (event.type === 'result' && event.result) {
    return event.result.split('\n');
  }

  return [];
}
