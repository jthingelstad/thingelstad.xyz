// The "Jamie's sites" strip that opens every page. Each of Jamie's sites renders the same strip, so its
// markup, classes and values are a shared contract, kept in the thingelstad.com repository's AGENTS.md
// ("The sites strip"); change it there first. The list is data/sites.json, a byte-for-byte copy of that
// repository's shared/sites.json, refreshed by `npm run sites:sync` and never edited here.
export const sitesPath = 'data/sites.json';
const currentSite = 'xyz';

type SharedSite = {
  id: string;
  name: string;
  short_name: string;
  strip_label: string;
  url: string;
  description: string;
  in_sites_strip: boolean;
};

export function parseSites(text: string, path = sitesPath): SharedSite[] {
  const data = JSON.parse(text) as { sites?: unknown };
  if (!Array.isArray(data.sites) || !data.sites.length) throw new Error(`${path} has no sites list.`);
  for (const site of data.sites as SharedSite[]) {
    for (const field of ['id', 'name', 'short_name', 'strip_label', 'url', 'description'] as const) {
      if (typeof site[field] !== 'string' || !site[field]) throw new Error(`${path}: a site has no ${field}.`);
    }
    if (!site.url.startsWith('https://')) throw new Error(`${path}: ${site.id} is not an HTTPS URL.`);
  }
  return data.sites as SharedSite[];
}

// The sites marked in_sites_strip, in file order. Every site, this one included, reads as its strip_label
// ("Things I’ve built" here too), so the strip says the same on every site; the current one differs only in
// its marking. Every link carries ?ref=sites-strip-<this site> so the Tinylytics Sources report on the
// destination shows the visits this strip sent.
export function sitesStrip(sites: SharedSite[], current = currentSite) {
  const items = sites
    .filter((site) => site.in_sites_strip)
    .map((site) => ({
      id: site.id,
      href: `${site.url}${site.url.includes('?') ? '&' : '?'}ref=sites-strip-${encodeURIComponent(current)}`,
      description: site.description,
      label: site.strip_label,
      current: site.id === current
    }));
  if (!items.some((item) => item.current)) throw new Error(`The sites list does not put ${current} in the strip.`);
  return items;
}
