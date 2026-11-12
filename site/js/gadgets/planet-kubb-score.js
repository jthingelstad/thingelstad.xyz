// Planet Kubb Score's gadget: the reader types or pastes a game in Planet Kubb Notation and sees it read and scored as
// they type. Both halves are the notation's own code, vendored from pk-kubb-score by npm run kubb:sync: the parser
// Peggy generates from its grammar decides what is valid and says where it is not, and its kubb.js replays the game
// to score it. Nothing is fetched and nothing is sent; it all runs here. A failure says so in the gadget, never throws.
import { parse } from './planet-kubb-score/notation-parser.js';
import { analyze } from './planet-kubb-score/kubb.js';
import example from './planet-kubb-score/example.js';

const number = new Intl.NumberFormat('en-US');
const plural = (count, one, many) => `${number.format(count)} ${count === 1 ? one : many}`;
const percent = (share) => (share === null || Number.isNaN(share) ? '–' : `${Math.round(share * 100)}%`);

const element = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};

// How the game ended, in the words of pk-kubb-score's own stats page (site/assets/stats.js).
const ending = (game) => {
  if (!game.winner) return 'No winner yet.';
  const how = game.winHow || '';
  const words =
    how === 'king'
      ? `took the king in turn ${game.endTurn}`
      : how === 'Win header'
        ? 'won, as the Win header says'
        : how.startsWith('illegal')
          ? `won in turn ${game.endTurn}: the other team knocked the king over illegally`
          : how.startsWith('called')
            ? `won in turn ${game.endTurn} when the game was called`
            : how.startsWith('resigned')
              ? `won in turn ${game.endTurn} when the other team resigned`
              : 'won';
  return `${game.teamName[game.winner]} ${words}.`;
};

const opened = (game) => {
  const why =
    game.firstSource === 'inferred'
      ? ', worked out from who took the king'
      : game.firstSource === 'default'
        ? ', assumed until a First header says otherwise'
        : '';
  return `${game.teamName[game.first]} threw first${why}.`;
};

const teamTable = (game) => {
  const { A, B } = game.stats;
  const table = element('table', undefined, 'kubb-teams');
  const head = table.createTHead().insertRow();
  for (const [text, side] of [
    ['', null],
    [game.teamName.A, 'A'],
    [game.teamName.B, 'B']
  ]) {
    const cell = element('th', text);
    cell.scope = 'col';
    if (side === game.winner) cell.className = 'is-winner';
    head.append(cell);
  }
  const body = table.createTBody();
  const rows = [
    ['Turns', (s) => number.format(s.turns)],
    ['Batons thrown', (s) => number.format(s.batons)],
    ['Hits', (s) => number.format(s.hits)],
    ['Hit rate', (s) => percent(s.hitPct)],
    ['Field kubbs', (s) => number.format(s.field)],
    ['Base kubbs', (s) => number.format(s.base)],
    ['Kings', (s) => number.format(s.kings)]
  ];
  for (const [label, value] of rows) {
    const row = body.insertRow();
    const name = element('th', label);
    name.scope = 'row';
    row.append(name, element('td', value(A)), element('td', value(B)));
  }
  return table;
};

function gadget(box) {
  const input = box.querySelector('[data-kubb-input]');
  const verdict = box.querySelector('[data-kubb-verdict]');
  const where = box.querySelector('[data-kubb-where]');
  const score = box.querySelector('[data-kubb-score]');
  const reset = box.querySelector('[data-kubb-reset]');

  const show = () => {
    const text = input.value;
    where.hidden = true;
    score.replaceChildren();
    verdict.classList.remove('is-valid', 'is-invalid');
    if (!text.trim()) {
      verdict.textContent = 'Type or paste a game to score it.';
      return;
    }
    let parsed;
    try {
      parsed = parse(text);
    } catch (error) {
      verdict.classList.add('is-invalid');
      const at = error?.location?.start;
      if (!at) {
        verdict.textContent = 'This could not be read as notation.';
        return;
      }
      verdict.textContent = `Not valid notation. Line ${at.line}, column ${at.column}: ${error.message}`;
      const line = text.split(/\r\n|\n|\r/)[at.line - 1] ?? '';
      where.textContent = `${line}\n${' '.repeat(Math.max(0, at.column - 1))}^`;
      where.hidden = false;
      return;
    }
    verdict.classList.add('is-valid');
    verdict.textContent = `Valid notation: ${plural(parsed.headers.length, 'header', 'headers')}, ${plural(parsed.turns.length, 'turn', 'turns')}.`;
    let game;
    try {
      game = analyze(text);
    } catch {
      score.append(element('p', 'The notation is valid, but the game could not be replayed to score it.'));
      return;
    }
    if (!game.rows.length) return;
    score.append(
      element('p', `${ending(game)} ${opened(game)}`, 'kubb-result'),
      element('div', undefined, 'kubb-table')
    );
    score.lastChild.append(teamTable(game));
    const warnings = [
      ...game.warnings,
      ...game.rows.flatMap((row) => row.warnings.map((warning) => `Turn ${row.turn}: ${warning}`))
    ];
    if (warnings.length) {
      score.append(element('p', 'Replaying the game found:', 'kubb-warnings-label'));
      const list = element('ul', undefined, 'kubb-warnings');
      for (const warning of warnings) list.append(element('li', warning));
      score.append(list);
    }
  };

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(show, 120);
  });
  reset.addEventListener('click', () => {
    input.value = example;
    show();
  });
  input.value = example;
  box.hidden = false;
  show();
}

for (const box of document.querySelectorAll('[data-kubb-score-gadget]')) gadget(box);
