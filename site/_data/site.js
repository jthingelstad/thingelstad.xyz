// Global data for every template: the site model built from the content tree and the observations.
import { loadRegistry } from '../../collection/load.ts';
import { loadObservations } from '../../collection/observations.ts';
import { buildSiteModel } from '../../collection/site.ts';

export default async function () {
  const [registry, observations] = await Promise.all([loadRegistry(), loadObservations()]);
  return buildSiteModel(registry, observations);
}
