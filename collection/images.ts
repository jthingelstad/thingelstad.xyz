// The pictures a page shows, as the files it loads. An artifact image or a captured front page is kept as it is,
// and the build writes smaller copies of it under /assets/img/ (collection/image-files.ts): WebP at a few widths,
// for <img srcset>, and a JPEG no wider than 1200 for the page's share image (og:image). Their names come from
// the source's bytes and the recipe, so a changed file or a changed recipe is a new name, which the immutable
// cache on /assets/ needs, and the old files stay for open pages. Nothing here reads or writes a file: the model
// names every copy it uses, and the build makes exactly those.
import { createHash } from 'node:crypto';
import { basename, extname } from 'node:path';

// Bump when the sizes, formats or quality change, so every copy gets a new name.
const imageRecipe = 'img-2';
// The widths a picture is offered at. The widest box an image fills is the thing page's screenshot, 720 CSS
// pixels, so 1440 covers it on a 2x screen; a 300-pixel shelf card on a 3x phone takes 900. The steps past
// 1440 are only for wide images (widthsFor).
const pictureWidths = [360, 720, 900, 1080, 1440, 2160, 2880];
const widest = 1440;
const fallbackWidth = 720; // src, for a browser that ignores srcset
const shareMax = 1200; // the share image fits in 1200 x 1200

// One file the build writes: where it goes, its pixel size, and its format.
export type Rendition = { file: string; width: number; height: number; format: 'webp' | 'jpeg' };
// A source image: the file in the repository, its SHA-256, and its pixel size from its header.
export type ImageSource = { path: string; sha256: string; width: number; height: number };
// What an <img> needs: a src, a srcset of widths, and the source's own size for width and height (the copies all
// keep its shape). `renditions` are the files behind the srcset.
export type Picture = {
  src: string;
  srcset: string;
  width: number;
  height: number;
  source: ImageSource;
  renditions: Rendition[];
};
// A share image: one JPEG, with its size and words for og:image:alt.
export type ShareImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  source: ImageSource;
  rendition: Rendition;
};
// The work the build does for one source: every copy the model names, made from one decode.
export type ImageJob = { source: ImageSource; renditions: Rendition[] };

const key = (source: ImageSource) =>
  createHash('sha256').update(`${imageRecipe}\0${source.sha256}`).digest('hex').slice(0, 10);
const stem = (path: string) =>
  basename(path, extname(path))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'image';
const name = (source: ImageSource, suffix: string) => `/assets/img/${stem(source.path)}-${key(source)}-${suffix}`;
const scaled = (source: ImageSource, width: number) => Math.max(1, Math.round((source.height * width) / source.width));

// A GIF may be animated, and a copy would keep only its first frame, so a GIF is shown as it is.
export const keepsOriginal = (path: string) => extname(path).toLowerCase() === '.gif';

// The widths a source is offered at: each step narrower than the widest, then the widest, which is the source's own
// width or the top step, whichever is less. A wide image can be drawn wider than its box where it covers a 4:3 frame
// (the /artifacts/ figures), so its widest copy grows by as much as it is wider than 4:3, up to its own width.
// Never wider than the source, so nothing is enlarged, and a step within a tenth of the widest is left out as the
// same picture twice.
export function widthsFor(sourceWidth: number, sourceHeight: number) {
  const grow = Math.max(1, sourceWidth / sourceHeight / (4 / 3));
  const top = Math.min(sourceWidth, Math.round(widest * grow));
  const steps = pictureWidths.filter((w) => w < top * 0.9);
  return [...steps, top];
}

export function picture(source: ImageSource): Picture {
  const renditions: Rendition[] = widthsFor(source.width, source.height).map((width) => ({
    file: name(source, `${width}.webp`),
    width,
    height: scaled(source, width),
    format: 'webp'
  }));
  const fallback = renditions.findLast((r) => r.width <= fallbackWidth) ?? renditions[0];
  return {
    src: fallback.file,
    srcset: renditions.map((r) => `${r.file} ${r.width}w`).join(', '),
    width: source.width,
    height: source.height,
    source,
    renditions
  };
}

// The share image: the source as a JPEG that fits in 1200 x 1200, never enlarged. Transparency goes to white,
// the ground the artifacts sit on.
export function shareImage(source: ImageSource, alt: string): ShareImage {
  const scale = Math.min(1, shareMax / source.width, shareMax / source.height);
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const rendition: Rendition = { file: name(source, 'share.jpg'), width, height, format: 'jpeg' };
  return { src: rendition.file, width, height, alt, source, rendition };
}

// Gathers every copy the model names, one job per source, each file once.
export function imageJobs(images: (Picture | ShareImage)[]): ImageJob[] {
  const jobs = new Map<string, ImageJob>();
  for (const image of images) {
    const { source } = image;
    const renditions = 'renditions' in image ? image.renditions : [image.rendition];
    const job = jobs.get(source.path) ?? { source, renditions: [] };
    for (const rendition of renditions)
      if (!job.renditions.some((r) => r.file === rendition.file)) job.renditions.push(rendition);
    jobs.set(source.path, job);
  }
  return [...jobs.values()];
}
