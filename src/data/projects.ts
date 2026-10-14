import collectionData from './collection.json';
import type { Collection, Thing, Story } from './schema';

export const collection = collectionData as Collection;
export type CatalogEntry = Thing;
export type Project = Omit<Thing, 'story' | 'url'> & Story & { url: string };
export const catalog = collection.things;
export const projects: Project[] = catalog.flatMap((entry) =>
  entry.story ? [{ ...entry, ...entry.story, url: entry.url ?? '' }] : []
);
export const projectById = new Map(projects.map((project) => [project.id, project]));
export const entryById = new Map(catalog.map((entry) => [entry.id, entry]));

export function searchProjects(query: string): CatalogEntry[] {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return catalog;
  return catalog.filter((entry) => {
    const text = [entry.title, entry.summary, entry.collection, ...(entry.story?.stack ?? [])]
      .join(' ')
      .toLocaleLowerCase();
    return terms.every((term) => text.includes(term));
  });
}
