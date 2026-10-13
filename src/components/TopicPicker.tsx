import { topics, topicById } from '../data/topics';

type Props = { selected: string | null; onChange: (id: string | null) => void };
export function TopicPicker({ selected, onChange }: Props) {
  const topic = selected ? topicById.get(selected) : null;
  return (
    <div className="topic-picker">
      <div className="topic-options" aria-label="Explore topics">
        <span>Follow an interest</span>
        <button aria-pressed={!selected} onClick={() => onChange(null)}>
          All things
        </button>
        {topics.map((entry) => (
          <button
            key={entry.id}
            aria-pressed={selected === entry.id}
            onClick={() => onChange(selected === entry.id ? null : entry.id)}
          >
            {entry.title}
            <span>{entry.projectIds.length}</span>
          </button>
        ))}
      </div>
      {topic && (
        <p className="topic-description" aria-live="polite">
          <strong>{topic.title}</strong> · {topic.description}
        </p>
      )}
    </div>
  );
}
