import { motion, useReducedMotion } from 'motion/react';
import { eventKindLabels, eventsForTopic, formatEventDate, historyYears } from '../data/history';
import { entryById } from '../data/projects';
import { TopicPicker } from './TopicPicker';
import { Icon } from './Icon';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
type Props = {
  year: number;
  month: number | null;
  topic: string | null;
  onFilter: (year: number, month: number | null) => void;
  onTopic: (id: string | null) => void;
  onSelect: (id: string) => void;
};
export function History({ year, month, topic, onFilter, onTopic, onSelect }: Props) {
  const reduced = useReducedMotion();
  const events = eventsForTopic(topic).filter((event) => Number(event.date.slice(0, 4)) === year);
  const dated = events.filter((event) => event.date.length >= 7);
  const undated = events.filter((event) => event.date.length === 4);
  const visible = events
    .filter((event) => month === null || Number(event.date.slice(5, 7)) === month)
    .toSorted((a, b) => b.date.localeCompare(a.date));
  return (
    <section className="history-view browse-home">
      <div className="map-intro">
        <div>
          <h1>A history of building.</h1>
          <p>Things begin. Ideas evolve. Some become something else.</p>
        </div>
        <span className="collection-count">A growing record, with sources.</span>
      </div>
      <TopicPicker selected={topic} onChange={onTopic} />
      <div className="history-heading">
        <div>
          <h2>{year}</h2>
          <span>{events.length} documented events</span>
        </div>
        <select
          aria-label="Choose history year"
          value={year}
          onChange={(event) => onFilter(Number(event.target.value), null)}
        >
          {historyYears.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>
      <div className="activity-map" aria-label={`Monthly documented activity in ${year}`}>
        {months.map((title, index) => {
          const count = dated.filter((event) => Number(event.date.slice(5, 7)) === index + 1).length;
          return (
            <button
              key={title}
              className={`activity-month intensity-${Math.min(count, 3)}`}
              aria-label={`${title} ${year}: ${count} documented events`}
              aria-pressed={month === index + 1}
              onClick={() => onFilter(year, month === index + 1 ? null : index + 1)}
            >
              <span>{title}</span>
              <strong>{count || '—'}</strong>
            </button>
          );
        })}
      </div>
      <div className="history-key">
        <span>Monthly activity · select a month to explore</span>
        <span>
          Fewer <i />
          <i />
          <i /> More
        </span>
      </div>
      <p className="history-note">
        A curated record of launches, changes, and recorded development—not a count of every commit. Empty months have
        no indexed events yet.
        {undated.length > 0 ? ` ${undated.length} event has only a known year and appears in the full year below.` : ''}
      </p>
      <div className="history-list-heading">
        <h3>{month ? `${months[month - 1]} ${year}` : 'The whole year'}</h3>
        {month && (
          <button className="text-link" onClick={() => onFilter(year, null)}>
            Show the whole year
          </button>
        )}
      </div>
      <div className="history-events" aria-live="polite">
        {visible.map((event) => (
          <motion.article
            key={event.id}
            className="history-event"
            initial={reduced ? false : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="event-date">
              <time dateTime={event.date}>{formatEventDate(event.date)}</time>
              <span>{eventKindLabels[event.kind]}</span>
            </div>
            <div>
              <h3>{event.title}</h3>
              <p>{event.summary}</p>
              <div className="event-projects">
                {event.projectIds.map((id) => (
                  <button key={id} onClick={() => onSelect(id)}>
                    {entryById.get(id)!.title}
                    <Icon name="arrow" size={12} />
                  </button>
                ))}
              </div>
              <a className="event-source" href={event.source} target="_blank" rel="noreferrer">
                Read the source <Icon name="external" size={12} />
              </a>
            </div>
          </motion.article>
        ))}
        {!visible.length && <p className="empty-state">No events have been indexed for this selection yet.</p>}
      </div>
    </section>
  );
}
