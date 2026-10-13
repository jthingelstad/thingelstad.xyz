import { useState } from 'react';
import { Icon } from './Icon';
import { entryById, projectById } from '../data/projects';
import { neighbors } from '../data/connections';
import { versionNumber, localDay } from '../lib/version';

export function ProjectDetail({
  id,
  onOpen,
  onAsk,
  onBack
}: {
  id: string;
  onOpen: (id: string) => void;
  onAsk: (q: string) => void;
  onBack: () => void;
}) {
  const project = projectById.get(id),
    entry = entryById.get(id)!;
  const [birthday, setBirthday] = useState('1974-01-15');
  const [command, setCommand] = useState('mb posts list --limit 3');
  const [equation, setEquation] = useState(false);
  const relatives = [...new Set([...neighbors(id), ...(project?.related ?? [])])].filter((other) =>
    entryById.has(other)
  );
  return (
    <section className="detail-view">
      <button className="back-link" onClick={onBack}>
        <Icon name="back" size={16} /> Back to exploring
      </button>
      <div className="detail-hero">
        <div>
          <span className="eyebrow">
            {entry.collection}
            {entry.historical ? ' · From the archive' : ''}
          </span>
          <h1>{entry.title}</h1>
          <p className="detail-tagline">{project?.introduction ?? entry.summary}</p>
          <div className="detail-links">
            {entry.url && (
              <a className="primary-link" href={entry.url} target="_blank" rel="noreferrer">
                {entry.historical ? 'Explore the archive' : 'Visit this thing'} <Icon name="external" size={16} />
              </a>
            )}
            {project?.source && project.source !== entry.url && (
              <a href={project.source} target="_blank" rel="noreferrer">
                {project.sourceLabel ?? 'Source'} <Icon name="external" size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="detail-body">
        <div>
          <span className="eyebrow">The idea</span>
          <p className="story-copy">{project?.idea ?? entry.summary}</p>
          {project?.started && <p className="quiet-note">{project.started}</p>}
          {project && (
            <>
              <h2>Inside the build</h2>
              <ul className="build-list">
                {project.engineering.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="stack">
                {project.stack.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </>
          )}
          {relatives.length > 0 && (
            <div className="related-things">
              <h2>Follow the connections</h2>
              {relatives.map((other) => (
                <button key={other} onClick={() => onOpen(other)}>
                  {entryById.get(other)!.title}
                  <Icon name="arrow" size={15} />
                </button>
              ))}
            </div>
          )}
        </div>
        <aside className="detail-side">
          {id === 'your-version-number' && (
            <div className="try-it">
              <span className="eyebrow">Try the idea</span>
              <h2>You, versioned.</h2>
              <label htmlFor="birthday">Your birthday</label>
              <input
                id="birthday"
                type="date"
                value={birthday}
                max={localDay()}
                onChange={(e) => setBirthday(e.target.value)}
              />
              <output className="version-output">{versionNumber(birthday) ?? '—'}</output>
              <p>Decades. Years. Days since your birthday.</p>
            </div>
          )}
          {id === 'mb' && (
            <div className="try-it">
              <span className="eyebrow">A little of the interface</span>
              <h2>
                Small commands.
                <br />
                Open possibilities.
              </h2>
              <label htmlFor="command">Example command</label>
              <select id="command" value={command} onChange={(e) => setCommand(e.target.value)}>
                <option>mb posts list --limit 3</option>
                <option>mb mcp serve</option>
                <option>mb receipts list</option>
              </select>
              <pre>$ {command}</pre>
              <p>
                {command.includes('mcp')
                  ? 'Expose the same services as typed tools for an AI client.'
                  : command.includes('receipts')
                    ? 'Inspect durable records of write operations before deciding to retry.'
                    : 'List recent posts as structured, pipeable output.'}
              </p>
              <span className="quiet-note">Illustrative command preview.</span>
            </div>
          )}
          {id === 'road-sign-math' && (
            <div className="try-it">
              <span className="eyebrow">Look a little closer</span>
              <h2>Can you find it?</h2>
              <button
                className="road-equation"
                onClick={() => setEquation(!equation)}
                aria-label="Reveal the road sign equation"
              >
                {equation ? '35 + 65 = 100' : '35   65   100'}
              </button>
              <p>
                {equation
                  ? 'There it is. Ordinary numbers, an unexpected equation.'
                  : 'Three numbers on a sign. Tap to reveal an equation.'}
              </p>
              <span className="quiet-note">An illustration of the game’s idea.</span>
            </div>
          )}
          <div className="ask-about">
            <span className="eyebrow">Go a little deeper</span>
            <h2>Curious about this thing?</h2>
            {(
              project?.questions ?? [
                `How does ${entry.title} connect to other projects?`,
                `What is the idea behind ${entry.title}?`
              ]
            ).map((q) => (
              <button key={q} onClick={() => onAsk(q)}>
                {q}
                <Icon name="arrow" size={15} />
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
