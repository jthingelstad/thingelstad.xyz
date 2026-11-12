// Your Version Number's gadget: a birthday gives the Birthday Edition's decades.years.days, and the day a job started
// gives the Work Edition's years.quarter.days with its build. The arithmetic is yourversionnumber.com's, copied from
// its assets/site.js (computeVersion and computeTenure, which the site keeps identical to both editions) and kept in
// step by hand: the number here has to be the number the site shows one click later. Nothing is stored or sent; the
// one link out carries the date only if the reader follows it, the way the site's own form does.
const LAUNCH = '2026-05-01'; // yourversionnumber.com went live, so it has a version number of its own
const DAY = 86_400_000;

// decades.years.days: completed decades, the year within the decade, days since the last birthday. A birthday on
// 29 February falls on 1 March in other years, the way JavaScript dates roll over, as on the site.
function computeVersion(since, today = new Date()) {
  const [y, m, d] = since.split('-').map(Number);
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let year = midnight.getFullYear();
  let anniversary = new Date(year, m - 1, d);
  if (midnight < anniversary) {
    year -= 1;
    anniversary = new Date(year, m - 1, d);
  }
  const age = year - y;
  return { major: Math.floor(age / 10), minor: age % 10, patch: Math.round((midnight - anniversary) / DAY) };
}

// years.quarter.days+build: completed years in the job; which three-month step of the tenure year (1 to 4, counted
// from the start date, not January); business days since that quarter began; and every business day ever worked.
function computeTenure(start, today = new Date()) {
  const [sy, sm, sd] = start.split('-').map(Number);
  const startMid = new Date(sy, sm - 1, sd);
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (todayMid < startMid) return null;
  let anniversaryYear = todayMid.getFullYear();
  let anniversary = new Date(anniversaryYear, sm - 1, sd);
  if (todayMid < anniversary) {
    anniversaryYear -= 1;
    anniversary = new Date(anniversaryYear, sm - 1, sd);
  }
  let quarters = 1;
  let quarterStart = anniversary;
  for (let q = 1; q <= 3; q++) {
    const candidate = new Date(anniversaryYear, sm - 1 + q * 3, sd);
    if (todayMid >= candidate) {
      quarters = q + 1;
      quarterStart = candidate;
    } else break;
  }
  const workdays = (from, to) => {
    let n = 0;
    const cur = new Date(from);
    while (cur < to) {
      cur.setDate(cur.getDate() + 1);
      const dow = cur.getDay();
      if (dow >= 1 && dow <= 5) n++;
    }
    return n;
  };
  return {
    years: anniversaryYear - sy,
    quarters,
    days: workdays(quarterStart, todayMid),
    build: workdays(startMid, todayMid)
  };
}

const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// A date the field holds that is a real calendar day: the browser's date input gives YYYY-MM-DD or nothing.
const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number(value.slice(0, 4)) >= 1;
const plural = (n, one, many) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;

function gadget(panel) {
  const birthday = panel.querySelector('[data-yvn-birthday]');
  const start = panel.querySelector('[data-yvn-start]');
  const open = panel.querySelector('[data-yvn-open]');
  const [life, work] = ['birthday', 'work'].map((name) => {
    const box = panel.querySelector(`[data-yvn-result="${name}"]`);
    return { number: box.querySelector('[data-yvn-number]'), says: box.querySelector('[data-yvn-says]') };
  });
  panel.querySelector('[data-yvn-form]').addEventListener('submit', (event) => event.preventDefault());

  const show = (result, number, build, says) => {
    result.number.replaceChildren();
    if (number) {
      result.number.append(number);
      if (build) {
        const tag = document.createElement('span');
        tag.className = 'yvn-build';
        tag.textContent = build;
        result.number.append(tag);
      }
    }
    result.says.textContent = says;
  };

  const paint = () => {
    const today = localDate();
    birthday.max = today;
    start.max = today;
    const b = birthday.value;
    if (!isDate(b)) {
      const v = computeVersion(LAUNCH);
      show(
        life,
        `${v.major}.${v.minor}.${v.patch}`,
        '',
        `Enter a birthday. Until then, the site itself: it went live on May 1, 2026, so it is ${plural(v.patch, 'day', 'days')} into its first year.`
      );
    } else if (b > today) {
      show(life, '', '', 'That’s in the future. Version numbers only count up.');
    } else {
      const v = computeVersion(b);
      const since =
        v.patch === 0 ? 'and today is the birthday.' : `${plural(v.patch, 'day', 'days')} since the last birthday.`;
      show(
        life,
        `${v.major}.${v.minor}.${v.patch}`,
        '',
        `${plural(v.major, 'decade', 'decades')}, ${plural(v.minor, 'year', 'years')} into this one, ${since}`
      );
    }
    const s = start.value;
    if (!isDate(s)) {
      show(work, '', '', 'Enter the day a job started, for years, quarter and business days.');
    } else if (s > today) {
      show(work, '', '', 'That start date is in the future. Tenure is not accrued in advance.');
    } else {
      const t = computeTenure(s);
      show(
        work,
        `${t.years}.${t.quarters}.${t.days}`,
        `+${t.build.toLocaleString('en-US')}`,
        `${plural(t.years, 'year', 'years')} in, quarter ${t.quarters} of the tenure year, ${plural(t.days, 'business day', 'business days')} into it. Build ${t.build.toLocaleString('en-US')}: every business day ever worked there.`
      );
    }
    // The link out opens the edition with the date in its address, as the site's own form does, only if followed.
    if (isDate(b) && b <= today) open.href = `https://yourversionnumber.com/birthday/?p=${b}`;
    else if (isDate(s) && s <= today) open.href = `https://yourversionnumber.com/work/edition/?j=${s}`;
    else open.href = 'https://yourversionnumber.com/';
  };

  // The numbers change at local midnight and at no other time, so the gadget waits for the next one.
  const atMidnight = () => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    setTimeout(
      () => {
        paint();
        atMidnight();
      },
      next - now + 1000
    );
  };

  birthday.addEventListener('input', paint);
  start.addEventListener('input', paint);
  document.addEventListener('visibilitychange', () => document.hidden || paint());
  panel.hidden = false;
  paint();
  atMidnight();
}

for (const panel of document.querySelectorAll('[data-yvn]')) gadget(panel);
