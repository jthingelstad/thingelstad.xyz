export const contentTypes: Record<string, string>;
export const immutable: string;
export const revalidate: string;
export function contentTypeFor(key: string): string;
export function publishOrder(root: string): string[];
export function publishSteps(keys: string[]): string[][];
export function unpublished(keys: string[], sizes: Map<string, number>, live: Map<string, number>): string[];
export function cacheControlFor(key: string): string;
