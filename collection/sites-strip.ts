// The sites strip that opens every page. Each of Jamie's sites renders the same strip, so its
// markup, classes and values are a shared contract, kept in the thingelstad.com repository's AGENTS.md
// ("The sites strip"); change it there first. The list is the shared data/sites.json (collection/sites.ts).
import { currentSite, withRef, type SharedSite } from './sites';

// The sites marked in_sites_strip, in file order. Every site, this one included, reads as its strip_label
// ("Projects" here too), so the strip says the same on every site; the current one differs only in
// its marking. Every link carries ?ref=sites-strip-<this site> so the Tinylytics Sources report on the
// destination shows the visits this strip sent.
export function sitesStrip(sites: SharedSite[], current = currentSite) {
  const items = sites
    .filter((site) => site.in_sites_strip)
    .map((site) => ({
      id: site.id,
      href: withRef(site.url, `sites-strip-${current}`),
      description: site.description,
      label: site.strip_label,
      current: site.id === current
    }));
  if (!items.some((item) => item.current)) throw new Error(`The sites list does not put ${current} in the strip.`);
  return items;
}
