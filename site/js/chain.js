// The live panel on a thing that runs validators: Gnosis Chain's slot clock, which of the validators are attesting,
// and whether one of them is due to propose a block. The page reads fully without it; the panel stays hidden until
// this runs. Everything comes from the public beacon node (keyless, cross-origin), straight to the reader's browser.
// Nothing is sent to it but the indices that are already in the page, and only counts and indices are shown: never a
// balance, never an address. A failed read leaves the panel saying so and trying again next epoch; it never throws.
const NODE = 'https://rpc-gbc.gnosischain.com';
const GENESIS = 1638993340; // seconds, slot 0
const SLOT_SECONDS = 5;
const SLOTS_PER_EPOCH = 16;
// The same rule as the daily check in otto-ops (scripts/check_gnosis_validators.py): a validator is earning when its
// balance rose, or when it fell by at least 0.0002 GNO to just above 32, which is a withdrawal sweep, not a penalty.
const MAX_BALANCE = 32_000_000_000;
const SWEEP_MIN_DROP = 200_000;
const SWEEP_CEILING = MAX_BALANCE + 1_000_000;

const number = new Intl.NumberFormat('en-US');
const slotNow = () => Math.floor((Date.now() / 1000 - GENESIS) / SLOT_SECONDS);
const slotTime = (slot) => (GENESIS + slot * SLOT_SECONDS) * 1000;

const earned = (before, now) => {
  const swept = before - now >= SWEEP_MIN_DROP && now > MAX_BALANCE && now <= SWEEP_CEILING;
  return now > before || swept;
};

const read = async (path) => {
  const response = await fetch(`${NODE}${path}`, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return (await response.json()).data;
};

const balances = async (slot, ids) => {
  const rows = await read(`/eth/v1/beacon/states/${slot}/validator_balances?id=${ids}`);
  return new Map(rows.map((row) => [row.index, Number(row.balance)]));
};

const plural = (count, one, many) => `${number.format(count)} ${count === 1 ? one : many}`;
const inWords = (seconds) => {
  if (seconds < 60) return plural(seconds, 'second', 'seconds');
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest
    ? `${plural(minutes, 'minute', 'minutes')} and ${plural(rest, 'second', 'seconds')}`
    : plural(minutes, 'minute', 'minutes');
};

function live(panel) {
  const indices = panel.dataset.indices.split(' ').filter(Boolean);
  const wanted = new Set(indices);
  const dots = new Map([...panel.querySelectorAll('[data-index]')].map((dot) => [dot.dataset.index, dot]));
  const ticks = [...panel.querySelectorAll('.chain-epoch li')];
  const slotText = panel.querySelector('[data-chain-slot]');
  const epochText = panel.querySelector('[data-chain-epoch]');
  const summary = panel.querySelector('[data-chain-summary]');
  const dutyText = panel.querySelector('[data-chain-duty]');
  let duties = null; // the next proposals by one of these validators, from the current and next epoch's duties
  let readEpoch = null; // the epoch last read, so a read happens once an epoch
  let reading = false;

  const showDuty = (slot) => {
    if (!duties) {
      dutyText.textContent = '';
      return;
    }
    const next = duties.find((duty) => duty.slot >= slot);
    if (!next) {
      dutyText.textContent = `None of them is due to propose a block before slot ${number.format(duties.through + 1)}.`;
      return;
    }
    if (next.slot === slot) {
      dutyText.textContent = `Validator ${next.index} is proposing slot ${number.format(next.slot)} now.`;
      return;
    }
    const seconds = Math.max(0, Math.round((slotTime(next.slot) - Date.now()) / 1000));
    dutyText.textContent = `Validator ${next.index} is due to propose slot ${number.format(next.slot)} in ${inWords(seconds)}.`;
  };

  const refresh = async (epoch) => {
    if (reading) return;
    reading = true;
    try {
      const ids = indices.join(',');
      const head = Number((await read('/eth/v1/beacon/headers/head')).header.message.slot);
      const [now, before, current, next] = await Promise.all([
        balances(head, ids),
        balances(head - 2 * SLOTS_PER_EPOCH, ids),
        read(`/eth/v1/validator/duties/proposer/${epoch}`),
        read(`/eth/v1/validator/duties/proposer/${epoch + 1}`)
      ]);
      let attesting = 0;
      for (const [index, dot] of dots) {
        const lit = now.has(index) && before.has(index) && earned(before.get(index), now.get(index));
        dot.classList.toggle('is-lit', lit);
        dot.title = `Validator ${index}, ${lit ? 'attesting' : 'not attesting'}`;
        if (lit) attesting++;
      }
      summary.textContent =
        attesting === indices.length
          ? `All ${indices.length} attesting, read at slot ${number.format(head)}.`
          : `${attesting === 0 ? 'None' : number.format(attesting)} of the ${indices.length} attesting, read at slot ${number.format(head)}.`;
      duties = [...current, ...next]
        .filter((duty) => wanted.has(duty.validator_index))
        .map((duty) => ({ index: duty.validator_index, slot: Number(duty.slot) }))
        .sort((a, b) => a.slot - b.slot);
      duties.through = (epoch + 2) * SLOTS_PER_EPOCH - 1;
      readEpoch = epoch;
    } catch {
      summary.textContent = 'The beacon node could not be reached just now. The panel tries again next epoch.';
      duties = null;
      readEpoch = epoch; // one try an epoch, not one a second
    } finally {
      reading = false;
    }
  };

  const tick = () => {
    const slot = slotNow();
    const epoch = Math.floor(slot / SLOTS_PER_EPOCH);
    const place = slot % SLOTS_PER_EPOCH;
    slotText.textContent = `Slot ${number.format(slot)}`;
    epochText.textContent = `· ${place + 1} of ${SLOTS_PER_EPOCH} in epoch ${number.format(epoch)}`;
    for (const [n, li] of ticks.entries()) {
      const at = epoch * SLOTS_PER_EPOCH + n;
      li.classList.toggle('is-past', n < place);
      li.classList.toggle('is-now', n === place);
      li.classList.toggle('is-due', Boolean(duties?.some((duty) => duty.slot === at)));
    }
    showDuty(slot);
    if (readEpoch !== epoch && !document.hidden) refresh(epoch).then(() => showDuty(slotNow()));
  };

  panel.hidden = false;
  tick();
  setInterval(tick, 1000);
  document.addEventListener('visibilitychange', () => document.hidden || tick());
}

for (const panel of document.querySelectorAll('[data-chain-live]')) live(panel);
