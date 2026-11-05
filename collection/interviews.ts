// An interview session's transcript, read into its questions. The body of content/interviews/session-N.md is a
// `### N. question` heading per question, then the turns under it: `**Jamie:**`, `**Thingy:**`, a `#### Follow-up:`
// heading (Thingy asking again), and `**Thingy’s correction:**`, a note of Thingy's under an answer, which leaves the
// answer where it is. A paragraph with no speaker continues the turn before it.

export type Turn = {
  who: 'jamie' | 'thingy' | 'correction';
  followUp?: boolean;
  text: string; // Markdown, without the speaker's label
};
export type TranscriptQuestion = { n: number; question: string; turns: Turn[] };

export function parseTranscript(body: string): TranscriptQuestion[] {
  const parts = body.split(/^### (\d+)\. (.+)$/m);
  const questions: TranscriptQuestion[] = [];
  for (let i = 1; i < parts.length; i += 3) {
    const turns: Turn[] = [];
    for (const raw of parts[i + 2].split(/\n\s*\n/)) {
      const paragraph = raw.trim();
      if (!paragraph) continue;
      const followUp = paragraph.match(/^#### Follow-up:\s*([\s\S]+)$/);
      const speaker = paragraph.match(/^\*\*(Jamie|Thingy|Thingy’s correction):\*\*\s*([\s\S]+)$/);
      if (followUp) turns.push({ who: 'thingy', followUp: true, text: followUp[1] });
      else if (speaker)
        turns.push({
          who: speaker[1] === 'Jamie' ? 'jamie' : speaker[1] === 'Thingy' ? 'thingy' : 'correction',
          text: speaker[2]
        });
      else if (turns.length) turns.at(-1)!.text += `\n\n${paragraph}`;
      else throw new Error(`Question ${parts[i]}: a paragraph with no speaker comes before any turn.`);
    }
    questions.push({ n: Number(parts[i]), question: parts[i + 1].trim(), turns });
  }
  return questions;
}
