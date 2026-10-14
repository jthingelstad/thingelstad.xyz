export function editorHostAllowed(host: string | undefined, origins: ReadonlySet<string>) {
  if (!host) return false;
  return [...origins].some((origin) => {
    const url = new URL(origin);
    return host === url.host || (url.protocol === 'https:' && host === url.hostname);
  });
}
