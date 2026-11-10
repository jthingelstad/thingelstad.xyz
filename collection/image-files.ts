// Writes the copies the model names (collection/images.ts) into the build, under /assets/img/. Each copy is made
// once and kept in a cache outside git (.cache/images/), named as it is published, so a later build copies it
// rather than encoding it again; the name holds the source's hash and the recipe, so a cached file is never stale.
// A cold build (CI) makes every copy; a source is decoded once for all of its copies.
import { availableParallelism } from 'node:os';
import { copyFile, mkdir, readFile, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import sharp, { type Sharp } from 'sharp';
import type { ImageJob, Rendition } from './images';

const imageCache = process.env.XYZ_IMAGE_CACHE ?? '.cache/images';

// WebP for the srcset copies, keeping the source's colour profile (screenshots from a Mac are often Display
// P3); a plain sRGB JPEG for the share image, which the sites that show it read most reliably. WebP quality 75
// weighs about a fifth less than 82 did and looks the same enlarged twice, on a screenshot's type and on a photo.
function encode(base: Sharp, rendition: Rendition) {
  const sized = base.clone().resize(rendition.width, rendition.height, { fit: 'fill' });
  return rendition.format === 'webp'
    ? sized.keepIccProfile().webp({ quality: 75, effort: 4, smartSubsample: true })
    : sized.flatten({ background: '#ffffff' }).jpeg({ quality: 82, mozjpeg: true });
}

async function makeJob(job: ImageJob, cache: string) {
  const missing = job.renditions.filter((r) => !existsSync(join(cache, basename(r.file))));
  if (!missing.length) return 0;
  const base = sharp(await readFile(job.source.path), { limitInputPixels: false });
  for (const rendition of missing) {
    const target = join(cache, basename(rendition.file));
    const partial = `${target}.${process.pid}.part`;
    await encode(base, rendition).toFile(partial);
    await rename(partial, target);
  }
  return missing.length;
}

// Makes what is missing from the cache, then copies every named file into `output`. Returns how many it made
// and how many it copied.
export async function writeImages(jobs: ImageJob[], output: string, cache = imageCache) {
  await mkdir(cache, { recursive: true });
  await mkdir(join(output, 'assets/img'), { recursive: true });
  const queue = [...jobs];
  let made = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(4, availableParallelism())) }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const count = await makeJob(job, cache);
      made += count;
    }
  });
  await Promise.all(workers);
  const files = [...new Set(jobs.flatMap((job) => job.renditions.map((r) => r.file)))];
  await Promise.all(files.map((file) => copyFile(join(cache, basename(file)), join(output, file.slice(1)))));
  return { made, copied: files.length };
}
