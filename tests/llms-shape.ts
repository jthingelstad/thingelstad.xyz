// The shape /llms.txt keeps so the llmstxt.org reference parser (llms-txt 0.0.7, parse_llms_file) reads all of it.
// The parser splits the file at every line that starts `##` (so `###` starts a section too) and reads every
// non-empty line under a heading with re.search(r'-\s*\[(?P<title>[^\]]+)\]\((?P<url>[^\)]+)\)(:\s*(?P<desc>.*))?')
// .groupdict(): one line without a link fails the whole parse, and of two links on a line it keeps the first. So
// the title, the optional `> summary` and any prose come before the first heading, and under each heading every
// line is `- [name](url): notes`, one link, with no bracket in the name.
const linkLine = /^- \[[^\]]+\]\(https?:[^)\s]+\)(: \S.*)?$/;

export function llmsShapeProblems(text: string): string[] {
  const problems: string[] = [];
  let sections = 0;
  text.split('\n').forEach((line, index) => {
    const at = `line ${index + 1}`;
    if (index === 0) {
      if (!/^# \S/.test(line)) problems.push(`${at}: the file opens with "# Title"`);
    } else if (line.startsWith('##')) {
      sections++;
      if (!/^## \S/.test(line)) problems.push(`${at}: a heading is "## Name" (### starts a section too): ${line}`);
    } else if (!line.trim()) {
      // blank lines are free everywhere
    } else if (!sections) {
      if (line.startsWith('#')) problems.push(`${at}: no heading but the title above the first ##: ${line}`);
    } else if (!linkLine.test(line)) {
      problems.push(`${at}: under a heading every line is "- [name](url): notes": ${line}`);
    } else if (line.split('](').length !== 2) {
      problems.push(`${at}: one link a line: ${line}`);
    }
  });
  if (!sections) problems.push('no ## section');
  return problems;
}
