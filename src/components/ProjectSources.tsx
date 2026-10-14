import { useState } from 'react';
import { sourcesFor, observationFor } from '../data/sources';
import { Icon } from './Icon';

function day(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Chicago'
  }).format(new Date(value));
}
export function ProjectSources({ id, compact = false }: { id: string; compact?: boolean }) {
  const [observedNow] = useState(() => Date.now());
  const attached = sourcesFor(id);
  if (!attached.length) return null;
  return (
    <section className={`project-sources${compact ? ' sources-compact' : ''}`} aria-label="Project sources">
      <h3>Behind this thing</h3>
      {attached.map(({ source, attachment, snapshot }, index) => {
        const url =
          source.kind === 'github' ? (snapshot?.url ?? `https://github.com/${source.repository}`) : source.url;
        const activity = observationFor(snapshot, attachment.path);
        const stale = snapshot && observedNow - Date.parse(snapshot.fetchedAt) > 14 * 86400000;
        return (
          <article className="project-source" key={`${source.id}:${index}`}>
            <a href={url} target="_blank" rel="noreferrer">
              {source.kind === 'github'
                ? (snapshot?.repository ?? source.repository)
                : source.kind === 'archive'
                  ? 'Publishing archive'
                  : 'Website'}{' '}
              <Icon name="external" size={12} />
            </a>
            <span className="source-role">
              {attachment.role}
              {attachment.path ? ` · ${attachment.path}` : ''}
            </span>
            {source.kind === 'github' &&
              (!snapshot ? (
                <p>Repository evidence hasn’t been imported yet.</p>
              ) : (
                <>
                  {snapshot.archived && <span className="source-status">Repository archived</span>}
                  {!compact && (
                    <>
                      <p className="source-languages">
                        {snapshot.languages
                          .slice(0, 5)
                          .map((language) => language.name)
                          .join(' · ') || 'No language data'}
                        <span>Repository languages, measured by code bytes.</span>
                      </p>
                      {activity?.latestCommit && (
                        <p>
                          <a href={activity.latestCommit.url} target="_blank" rel="noreferrer">
                            Latest recorded commit · {day(activity.latestCommit.date)}
                          </a>
                        </p>
                      )}
                      <p>Repository created {day(snapshot.repositoryCreatedAt)}. This is not a launch date.</p>
                    </>
                  )}
                  {activity && (
                    <div className="source-activity">
                      <p>
                        {activity.complete ? activity.count : `At least ${activity.count}`} commits in the observed 90
                        days{attachment.path ? ` · ${attachment.path}` : ' · whole repository'}
                      </p>
                      {!compact && (
                        <div className="activity-bars" aria-label="Monthly commits in the observed window">
                          {activity.months.map((month) => (
                            <div key={month.month}>
                              <span>{month.month}</span>
                              <meter
                                min={0}
                                max={Math.max(1, ...activity.months.map((m) => m.count))}
                                value={month.count}
                              >
                                {month.count}
                              </meter>
                              <span>{month.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <span>
                        {day(activity.since)}–{day(activity.until)} · {activity.branch}
                      </span>
                    </div>
                  )}
                  {snapshot.release && (
                    <p>
                      <a href={snapshot.release.url} target="_blank" rel="noreferrer">
                        Release {snapshot.release.name} · {day(snapshot.release.date)}
                      </a>
                    </p>
                  )}
                  <span className="source-observed">
                    {stale ? 'Older snapshot · ' : ''}Observed {day(snapshot.fetchedAt)}
                  </span>
                </>
              ))}
            {source.kind === 'website' && source.sitemap && !compact && (
              <a className="source-role" href={source.sitemap} target="_blank" rel="noreferrer">
                Sitemap reference
              </a>
            )}
          </article>
        );
      })}
      {!compact && (
        <p className="source-explanation">
          Development activity is evidence, not a measure of importance. Shared repositories can support several things;
          their languages describe the repository as a whole.
        </p>
      )}
    </section>
  );
}
