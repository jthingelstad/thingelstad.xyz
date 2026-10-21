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
  url: string;
  description: string;
  in_sites_strip: boolean;
};

export function parseSites(text: string, path = sitesPath): SharedSite[] {
  const data = JSON.parse(text) as { sites?: unknown };
  if (!Array.isArray(data.sites) || !data.sites.length) throw new Error(`${path} has no sites list.`);
  for (const site of data.sites as SharedSite[]) {
    for (const field of ['id', 'name', 'short_name', 'url', 'description'] as const) {
      if (typeof site[field] !== 'string' || !site[field]) throw new Error(`${path}: a site has no ${field}.`);
    }
    if (!site.url.startsWith('https://')) throw new Error(`${path}: ${site.id} is not an HTTPS URL.`);
  }
  return data.sites as SharedSite[];
}

// The sites marked in_sites_strip, in file order. This site is the current one: it shows its short name
// ("Projects") and the others their full names.
export function sitesStrip(sites: SharedSite[], current = currentSite) {
  const items = sites
    .filter((site) => site.in_sites_strip)
    .map((site) => ({
      id: site.id,
      url: site.url,
      description: site.description,
      name: site.id === current ? site.short_name : site.name,
      current: site.id === current
    }));
  if (!items.some((item) => item.current)) throw new Error(`The sites list does not put ${current} in the strip.`);
  return items;
}
