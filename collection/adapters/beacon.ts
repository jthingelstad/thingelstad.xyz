// Validators on Gnosis Chain: how many blocks a thing's validators proposed, missed or had orphaned, month by month,
// read from two public explorers with no key. The first observation reads each validator's whole history from Dora
// (dora.gnosischain.com, HTML, 100 slots a page); every later one counts on from where the last stopped with the
// beaconcha.in API that beaconchain.gnosischain.com serves, 100 epochs a request. Only finalized epochs are counted,
// so a proposal's fate is settled when it is. Counts only: the API's records carry the fee recipient, and nothing
// here keeps it, or a balance.
import type { ProposalMonth, Thing, ValidatorsObservation } from '../schema';
import type { TextFetcher } from './web';

const genesis = 1_638_993_340; // the Gnosis beacon chain's genesis, in Unix seconds
const slotSeconds = 5;
const slotsPerEpoch = 16;
const doraPage = 100; // Dora shows at most 100 slots a page, whatever it is asked for
const apiWindow = 100; // the explorer answers for the 100 epochs up to the one it is asked about
const dora = 'https://dora.gnosischain.com';
const explorer = 'https://beaconchain.gnosischain.com/api/v1';

type Fate = 'proposed' | 'missed' | 'orphaned';
type Proposal = { slot: number; fate: Fate };

export const slotDate = (slot: number) => new Date((genesis + slot * slotSeconds) * 1000).toISOString().slice(0, 10);
const lastSlot = (epoch: number) => (epoch + 1) * slotsPerEpoch - 1;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

// One page of Dora's slot list for a validator: every row's slot and what became of it. A row Dora marks some other
// way (a slot still scheduled) is left to the caller, which counts only finalized slots; a row with no slot link is
// the empty table's message. Anything else means Dora changed its page, and the collector stops rather than guess.
export function parseDoraSlots(html: string): { slot: number; status: string }[] {
  const start = html.indexOf('<tbody');
  if (start < 0 || !html.includes('table-meta')) throw new Error('Dora returned a page without its slot table.');
  const body = html.slice(start, html.indexOf('</tbody>', start));
  return (body.match(/<tr[\s\S]*?<\/tr>/g) ?? []).flatMap((row) => {
    const slot = /href="\/slot\/(\d+)"/.exec(row)?.[1];
    if (!slot) return [];
    const status = /class="badge[^"]*">\s*([A-Za-z]+)\s*</.exec(row)?.[1];
    if (!status) throw new Error(`Dora's row for slot ${slot} has no status.`);
    return [{ slot: Number(slot), status: status.toLowerCase() }];
  });
}
function fate(status: string, slot: number): Fate {
  if (status === 'proposed' || status === 'missed' || status === 'orphaned') return status;
  throw new Error(`Slot ${slot} is finalized but its status is ${status}.`);
}

// Every proposal a validator has had, newest first, page by page until a short page. A page that repeats the one
// before it means Dora ignored the page number.
async function doraHistory(
  index: number,
  through: number,
  fetchText: TextFetcher,
  pause: (ms: number) => Promise<void>
) {
  const proposals: Proposal[] = [];
  let previous = '';
  for (let page = 0; page < 100; page++) {
    const rows = parseDoraSlots(
      await fetchText(`${dora}/slots/filtered?f&f.missing=1&f.orphaned=1&f.proposer=${index}&c=${doraPage}&s=${page}`)
    );
    const key = rows.map((r) => r.slot).join(',');
    if (rows.length && key === previous) throw new Error('Dora returned the same page twice.');
    previous = key;
    for (const row of rows)
      if (row.slot <= through) proposals.push({ slot: row.slot, fate: fate(row.status, row.slot) });
    if (rows.length < doraPage) return proposals;
    await pause(500);
  }
  throw new Error(`Validator ${index} has more proposals than the collector pages through.`);
}

const fates: Record<string, Fate | null> = { '0': null, '1': 'proposed', '2': 'missed', '3': 'orphaned' };
// The proposals in the finalized epochs after `since`, through `finalized`, for all the validators at once.
async function explorerProposals(
  indices: number[],
  since: number,
  finalized: number,
  fetchText: TextFetcher,
  pause: (ms: number) => Promise<void>
) {
  const found = new Map<number, Proposal>();
  for (let epoch = Math.min(since + apiWindow, finalized); ; epoch = Math.min(epoch + apiWindow, finalized)) {
    const response = JSON.parse(await fetchText(`${explorer}/validator/${indices.join(',')}/proposals?epoch=${epoch}`));
    if (!isRecord(response) || response.status !== 'OK' || !Array.isArray(response.data))
      throw new Error('Unexpected proposals response from the explorer.');
    for (const item of response.data.filter(isRecord)) {
      const slot = Number(item.slot);
      const itemEpoch = Number(item.epoch);
      if (!Number.isSafeInteger(slot) || !Number.isSafeInteger(itemEpoch)) throw new Error('Invalid proposal slot.');
      if (itemEpoch <= since || itemEpoch > finalized) continue;
      const status = String(item.status);
      if (!(status in fates)) throw new Error(`Slot ${slot} has an unknown status, ${status}.`);
      const settled = fates[status];
      if (!settled) throw new Error(`Slot ${slot} is finalized but still scheduled.`);
      found.set(slot, { slot, fate: settled });
    }
    if (epoch >= finalized) return [...found.values()];
    await pause(150);
  }
}

async function chainState(indices: number[], fetchText: TextFetcher) {
  const head = JSON.parse(await fetchText(`${explorer}/epoch/finalized`));
  const finalized = isRecord(head) && isRecord(head.data) ? Number(head.data.epoch) : NaN;
  if (!Number.isSafeInteger(finalized) || finalized <= 0) throw new Error('The explorer gave no finalized epoch.');
  const response = JSON.parse(await fetchText(`${explorer}/validator/${indices.join(',')}`));
  if (!isRecord(response) || response.status !== 'OK')
    throw new Error('Unexpected validator response from the explorer.');
  // The explorer answers a single validator with a record and several with a list.
  const rows = (Array.isArray(response.data) ? response.data : [response.data]).filter(isRecord);
  const statuses = rows.map((row) => String(row.status));
  return {
    finalized,
    active: statuses.filter((s) => s.startsWith('active')).length,
    online: statuses.filter((s) => s.startsWith('active') && s.endsWith('_online')).length,
    slashed: rows.filter((row) => row.slashed === true).length
  };
}

// Month by month from the first proposal through the month of the last slot counted, with empty months as zeros.
function monthsThrough(counts: Map<string, ProposalMonth>, through: string) {
  const known = [...counts.keys()].toSorted();
  if (!known.length) return [];
  const months: ProposalMonth[] = [];
  let [year, month] = known[0].split('-').map(Number);
  for (let key = known[0]; key <= through;) {
    months.push(counts.get(key) ?? { month: key, proposed: 0, missed: 0, orphaned: 0 });
    month += 1;
    if (month > 12) [year, month] = [year + 1, 1];
    key = `${year}-${String(month).padStart(2, '0')}`;
  }
  return months;
}

export async function observeValidators(
  thing: Thing,
  previous: ValidatorsObservation | undefined,
  fetchText: TextFetcher,
  now = new Date(),
  pause: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
): Promise<ValidatorsObservation> {
  if (!thing.validators) throw new Error(`${thing.id} lists no validators.`);
  const indices = thing.validators.indices.toSorted((a, b) => a - b);
  const state = await chainState(indices, fetchText);
  // The same validators count on from the last epoch counted; a new set (or none before) reads its history from Dora.
  const same = previous?.indices.join(',') === indices.join(',') ? previous : undefined;
  const until = Math.max(state.finalized, same?.until ?? 0);
  let proposals: Proposal[] = [];
  if (!same)
    for (const [i, index] of indices.entries()) {
      if (i) await pause(500);
      proposals.push(...(await doraHistory(index, lastSlot(until), fetchText, pause)));
    }
  else if (until > same.until) proposals = await explorerProposals(indices, same.until, until, fetchText, pause);
  const counts = new Map((same?.months ?? []).map((m) => [m.month, { ...m }]));
  for (const { slot, fate: settled } of proposals) {
    const month = slotDate(slot).slice(0, 7);
    const row = counts.get(month) ?? { month, proposed: 0, missed: 0, orphaned: 0 };
    row[settled] += 1;
    counts.set(month, row);
  }
  const months = monthsThrough(counts, slotDate(lastSlot(until)).slice(0, 7));
  const proposedDates = proposals.filter((p) => p.fate === 'proposed').map((p) => slotDate(p.slot));
  const firstProposal = [same?.firstProposal, ...proposedDates].filter((d): d is string => !!d).toSorted()[0];
  const latestProposal = [same?.latestProposal, ...proposedDates]
    .filter((d): d is string => !!d)
    .toSorted()
    .at(-1);
  const total = (key: Fate) => months.reduce((sum, m) => sum + m[key], 0);
  return {
    kind: 'validators',
    thing: thing.id,
    chain: thing.validators.chain,
    observedAt: now.toISOString(),
    until,
    indices,
    validators: indices.length,
    active: state.active,
    online: state.online,
    slashed: state.slashed,
    proposed: total('proposed'),
    missed: total('missed'),
    orphaned: total('orphaned'),
    firstProposal: firstProposal ?? null,
    latestProposal: latestProposal ?? null,
    months
  };
}
