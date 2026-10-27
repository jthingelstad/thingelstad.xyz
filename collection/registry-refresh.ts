import { createHash } from 'node:crypto';

const url = 'https://thingelstad.xyz/things.json';
type RegistryDocument = Record<string, unknown> & { things: unknown[] };
const document = (value: unknown): value is RegistryDocument =>
  !!value && typeof value === 'object' && Array.isArray((value as RegistryDocument).things);
const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`)
      .join(',')}}`;
  return JSON.stringify(value) ?? 'null';
};

/** A document revision, not an invented publication time for a thing. */
export function registryVersion(value: unknown): string | null {
  if (!document(value)) return null;
  const content = Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'generated'));
  return createHash('sha256').update(stable(content)).digest('hex');
}

export function registryRefresh(before: unknown, built: unknown, served: unknown, at: string) {
  const previous = registryVersion(before),
    current = registryVersion(built);
  if (!previous || !current || previous === current || !document(served) || stable(built) !== stable(served))
    return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(at)) return null;
  try {
    if (new Date(at).toISOString().replace('.000Z', 'Z') !== at) return null;
  } catch {
    return null;
  }
  return { source: 'xyz', 'detail-type': 'refreshed', detail: { id: current, at, url } };
}
