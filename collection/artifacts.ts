// What the site needs to know about an artifact file without trusting what anyone wrote about it: whether a
// browser can show it, an image's size read from its own header, and a plain name for its kind.
import { extname } from 'node:path';

const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
export const isImage = (file: string) => imageExtensions.includes(extname(file).toLowerCase());

// Every artifact is published as it is kept, so each one has a ceiling: the site is not a file store.
export const artifactMaxBytes = 25_000_000;

// An image's pixel size from its header, or null when the header is not one this reads. PNG, GIF, JPEG and
// WebP keep their size in the first bytes or the frame header, so nothing is decoded.
export function imageSize(bytes: Buffer): { width: number; height: number } | null {
  const ascii = (start: number, end: number) => bytes.toString('latin1', start, end);
  const size = (width: number, height: number) => (width > 0 && height > 0 ? { width, height } : null);
  if (bytes.length >= 24 && ascii(1, 4) === 'PNG' && ascii(12, 16) === 'IHDR')
    return size(bytes.readUInt32BE(16), bytes.readUInt32BE(20));
  if (bytes.length >= 10 && /^GIF8[79]a$/.test(ascii(0, 6))) return size(bytes.readUInt16LE(6), bytes.readUInt16LE(8));
  if (bytes.length >= 30 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') {
    const chunk = ascii(12, 16);
    if (chunk === 'VP8X') return size(bytes.readUIntLE(24, 3) + 1, bytes.readUIntLE(27, 3) + 1);
    if (chunk === 'VP8L' && bytes[20] === 0x2f) {
      const bits = bytes.readUInt32LE(21);
      return size((bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1);
    }
    if (chunk === 'VP8 ' && bytes.readUIntBE(23, 3) === 0x9d012a)
      return size(bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff);
    return null;
  }
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    // Walk the JPEG's segments to the first start-of-frame marker (C0 to CF, less C4, C8 and CC, which are not
    // frames); its header holds the height, then the width.
    let at = 2;
    while (at + 9 < bytes.length) {
      if (bytes[at] !== 0xff) return null;
      const marker = bytes[at + 1];
      if (marker === 0xff) {
        at++;
        continue;
      }
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
        at += 2;
        continue;
      }
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
        return size(bytes.readUInt16BE(at + 7), bytes.readUInt16BE(at + 5));
      at += 2 + bytes.readUInt16BE(at + 2);
    }
  }
  return null;
}

// A plain name for what a file is, from its extension. A kind not listed here is named by its extension.
const kinds: Record<string, string> = {
  '.png': 'PNG image',
  '.jpg': 'JPEG image',
  '.jpeg': 'JPEG image',
  '.gif': 'GIF image',
  '.webp': 'WebP image',
  '.svg': 'SVG image',
  '.pdf': 'PDF document',
  '.zip': 'ZIP archive',
  '.gz': 'gzip archive',
  '.tgz': 'gzip archive',
  '.txt': 'Text file',
  '.md': 'Markdown file',
  '.csv': 'CSV file',
  '.json': 'JSON file',
  '.ai': 'Adobe Illustrator file',
  '.psd': 'Photoshop file',
  '.ase': 'Adobe Swatch Exchange file',
  '.sketch': 'Sketch file',
  '.mp3': 'MP3 audio',
  '.mp4': 'MP4 video',
  '.mov': 'QuickTime video'
};
export const artifactKind = (file: string) => {
  const extension = extname(file).toLowerCase();
  return kinds[extension] ?? `${extension.slice(1).toUpperCase()} file`;
};

// A file's size the way the Finder counts it: in thousands, to two or three figures.
export function formatBytes(bytes: number) {
  if (bytes < 1000) return `${bytes} bytes`;
  const [value, unit] = bytes < 999_500 ? [bytes / 1000, 'KB'] : [bytes / 1_000_000, 'MB'];
  return `${value < 10 ? value.toFixed(1).replace(/\.0$/, '') : Math.round(value)} ${unit}`;
}
