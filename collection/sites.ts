// The shared list of Jamie's sites and the owner's h-card. The list is data/sites.json, a byte-for-byte copy
// of the thingelstad.com repository's shared/sites.json, refreshed by `npm run sites:sync` and never edited
// here. Its conventions (the strip, the h-card, refs on links between the sites) are a contract kept in that
// repository's AGENTS.md; change them there first.
export const sitesPath = 'data/sites.json';
export const currentSite = 'xyz';

export type SharedSite = {
  id: string;
  name: string;
  short_name: string;
  strip_label: string;
  url: string;
  description: string;
  in_sites_strip: boolean;
};
// Jamie, named the same way on every site: the footer h-card and the rel=me links in every <head>.
type Owner = {
  name: string;
  url: string;
  avatar: string; // the bird-on-the-hat photo, micro.blog's 200px copy
  note: string;
  rel_me: string[];
};
type SharedSites = { owner: Owner; sites: SharedSite[] };

const https = (value: unknown) => typeof value === 'string' && value.startsWith('https://');

export function parseSites(text: string, path = sitesPath): SharedSites {
  const data = JSON.parse(text) as { owner?: Partial<Owner>; sites?: unknown };
  if (!Array.isArray(data.sites) || !data.sites.length) throw new Error(`${path} has no sites list.`);
  for (const site of data.sites as SharedSite[]) {
    for (const field of ['id', 'name', 'short_name', 'strip_label', 'url', 'description'] as const) {
      if (typeof site[field] !== 'string' || !site[field]) throw new Error(`${path}: a site has no ${field}.`);
    }
    if (!https(site.url)) throw new Error(`${path}: ${site.id} is not an HTTPS URL.`);
  }
  const owner = data.owner;
  if (!owner || typeof owner !== 'object') throw new Error(`${path} has no owner.`);
  for (const field of ['name', 'url', 'avatar', 'note'] as const) {
    if (typeof owner[field] !== 'string' || !owner[field]) throw new Error(`${path}: the owner has no ${field}.`);
  }
  if (!https(owner.url) || !https(owner.avatar)) throw new Error(`${path}: the owner's url and avatar must be HTTPS.`);
  if (!Array.isArray(owner.rel_me) || !owner.rel_me.length || !owner.rel_me.every(https))
    throw new Error(`${path}: the owner's rel_me must be a list of HTTPS URLs.`);
  return { owner: owner as Owner, sites: data.sites as SharedSite[] };
}

// Adds ref=<value> to a URL: after any query it already has, and before any fragment.
export function withRef(url: string, ref: string) {
  const hash = url.indexOf('#');
  const [base, fragment] = hash === -1 ? [url, ''] : [url.slice(0, hash), url.slice(hash)];
  const separator = !base.includes('?') ? '?' : /[?&]$/.test(base) ? '' : '&';
  return `${base}${separator}ref=${encodeURIComponent(ref)}${fragment}`;
}

// Links from this site to another strip site carry ?ref=<this site>-<placement>, so Tinylytics' Sources
// report on the destination shows which connections people use. Any other URL, this site's own included,
// comes back as it was. Identity links (the h-card, rel=me) stay clean and never pass through here.
export function siteRef(sites: SharedSite[], current = currentSite) {
  const hosts = new Set(
    sites.filter((site) => site.in_sites_strip && site.id !== current).map((site) => new URL(site.url).hostname)
  );
  return (url: string, placement: string) => {
    if (typeof url !== 'string' || !URL.canParse(url) || !hosts.has(new URL(url).hostname)) return url;
    return withRef(url, `${current}-${placement}`);
  };
}
