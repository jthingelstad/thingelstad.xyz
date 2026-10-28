export const indexNowKey: string;
export const indexNowEndpoint: string;
export function sitemapUrls(xml: string): string[];
export function keyForUrl(url: string, siteUrl: string): string | null;
export function md5(bytes: string | Uint8Array): string;
export function changedUrls(input: {
  sitemapXml: string;
  siteUrl: string;
  built: Map<string, string>;
  live: Map<string, string>;
}): string[];
export function indexNowPayload(
  urls: string[],
  siteUrl: string
): { host: string; key: string; keyLocation: string; urlList: string[] };
export function pingIndexNow(
  urls: string[],
  siteUrl: string,
  options?: { fetch?: typeof fetch; dryRun?: boolean }
): Promise<string>;
export function builtPageHashes(siteRoot: string, sitemapXml: string, siteUrl: string): Map<string, string>;
