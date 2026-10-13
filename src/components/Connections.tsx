import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { connections, graphHeight, graphPositions, neighbors } from '../data/connections';
import { catalog, entryById, projectById } from '../data/projects';
import { Icon } from './Icon';

const startingPoints = [
  ['Writing & publishing', 'weekly-thing'],
  ['Games & agents', 'elixir'],
  ['Developer tools', 'mb'],
  ['Playful ideas', 'your-version-number'],
  ['Earlier things', 'road-sign-math']
] as const;

function labelLines(title: string) {
  const lines: string[] = [];
  for (const word of title.split(' ')) {
    const last = lines.length - 1;
    if (last >= 0 && `${lines[last]} ${word}`.length <= 23) lines[last] += ` ${word}`;
    else lines.push(word);
  }
  return lines;
}

type Props = {
  onOpen: (id: string) => void;
  selected: string;
  setSelected: (id: string) => void;
  onAsk: (question: string) => void;
  guideContent: ReactNode;
  guideActive: boolean;
  guideBusy: boolean;
};

export function Connections({ onOpen, selected, setSelected, onAsk, guideContent, guideActive, guideBusy }: Props) {
  const [zoom, setZoom] = useState(1);
  const [guideExpanded, setGuideExpanded] = useState(false);
  const [question, setQuestion] = useState('');
  const [dragging, setDragging] = useState(false);
  const canvas = useRef<HTMLDivElement>(null);
  const pan = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const reduced = useReducedMotion();
  const adjacent = neighbors(selected);
  const entry = entryById.get(selected)!;
  const project = projectById.get(selected);
  const edges = connections.filter((edge) => edge.from === selected || edge.to === selected);

  useEffect(() => {
    const area = canvas.current,
      svg = area?.querySelector('svg');
    if (!area || !svg) return;
    const scale = svg.getBoundingClientRect().width / 1200;
    const [x, y] = graphPositions[selected];
    area.scrollTo({
      left: Math.max(0, x * scale - area.clientWidth / 2),
      top: Math.max(0, y * scale - area.clientHeight / 2),
      behavior: reduced ? 'instant' : 'smooth'
    });
  }, [selected, zoom, reduced]);
  const [wasGuideActive, setWasGuideActive] = useState(guideActive);
  if (guideActive !== wasGuideActive) {
    setWasGuideActive(guideActive);
    if (guideActive) setGuideExpanded(true);
  }

  return (
    <section className="connections-view browse-home">
      <div className="map-intro">
        <div>
          <h1>Things I’ve built.</h1>
          <p>Pick a thing. Follow a connection. See where it takes you.</p>
        </div>
        <span className="collection-count">{catalog.length} things, and the threads between them.</span>
      </div>
      <div className="starting-points" aria-label="Places to start">
        <span>Start anywhere</span>
        {startingPoints.map(([title, id]) => (
          <button key={id} onClick={() => setSelected(id)} aria-pressed={selected === id}>
            {title}
            <Icon name="arrow" size={13} />
          </button>
        ))}
      </div>
      <div className="graph-layout">
        <div className="graph-stage">
          <div className="graph-controls">
            <select aria-label="Choose a project" value={selected} onChange={(e) => setSelected(e.target.value)}>
              {catalog.map((node) => (
                <option value={node.id} key={node.id}>
                  {node.title}
                </option>
              ))}
            </select>
            <button
              aria-label="Zoom out"
              disabled={zoom <= 0.75}
              onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
            >
              −
            </button>
            <button aria-label="Zoom in" disabled={zoom >= 2} onClick={() => setZoom((z) => Math.min(2, z + 0.25))}>
              +
            </button>
            <button onClick={() => setZoom(1)}>Reset</button>
          </div>
          <div
            ref={canvas}
            className={`graph-scroll${dragging ? ' is-dragging' : ''}`}
            aria-label="Project map canvas"
            tabIndex={0}
            onPointerDown={(event) => {
              if (
                event.pointerType !== 'mouse' ||
                event.button !== 0 ||
                (event.target as Element).closest('.graph-node')
              )
                return;
              event.preventDefault();
              const area = event.currentTarget;
              pan.current = { x: event.clientX, y: event.clientY, left: area.scrollLeft, top: area.scrollTop };
              area.setPointerCapture(event.pointerId);
              setDragging(true);
            }}
            onPointerMove={(event) => {
              if (!pan.current) return;
              event.currentTarget.scrollLeft = pan.current.left - (event.clientX - pan.current.x);
              event.currentTarget.scrollTop = pan.current.top - (event.clientY - pan.current.y);
            }}
            onPointerUp={() => {
              pan.current = null;
              setDragging(false);
            }}
            onPointerCancel={() => {
              pan.current = null;
              setDragging(false);
            }}
            onLostPointerCapture={() => {
              pan.current = null;
              setDragging(false);
            }}
          >
            <svg
              className="project-graph"
              viewBox={`0 0 1200 ${graphHeight}`}
              style={{ width: `${zoom * 100}%` }}
              aria-label="Project relationships"
            >
              <text className="map-region-label" x="110" y="40">
                WRITING, TOOLS & PUBLISHING
              </text>
              <text className="map-region-label" x="690" y="40">
                GAMES, AGENTS & COMMUNITIES
              </text>
              <text className="map-region-label" x="110" y="750">
                MORE THINGS TO EXPLORE
              </text>
              {connections.map((edge, index) => {
                const a = graphPositions[edge.from],
                  b = graphPositions[edge.to];
                const active = edge.from === selected || edge.to === selected;
                return (
                  <motion.path
                    key={`${edge.from}:${edge.to}`}
                    d={`M ${a[0]} ${a[1]} Q ${(a[0] + b[0]) / 2} ${Math.min(a[1], b[1]) - 15} ${b[0]} ${b[1]}`}
                    fill="none"
                    initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      stroke: active ? '#3373ee' : '#dce2eb',
                      strokeWidth: active ? 2.5 : 1.3,
                      opacity: active ? 1 : 0.8
                    }}
                    transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : index * 0.008 }}
                  />
                );
              })}
              {Object.entries(graphPositions).map(([id, [x, y]]) => {
                const node = entryById.get(id)!;
                const active = id === selected,
                  connected = adjacent.includes(id);
                const color = projectById.get(id)?.color ?? '#6a798a';
                return (
                  <g
                    key={id}
                    transform={`translate(${x} ${y})`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Show connections for ${node.title}`}
                    aria-pressed={active}
                    onClick={() => setSelected(id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelected(id);
                      }
                    }}
                    className={`graph-node${active ? ' selected' : ''}${connected ? ' connected' : ''}`}
                  >
                    <circle className="node-hit" r="25" fill="transparent" />
                    <circle
                      className="node-ring"
                      r={active ? 16 : projectById.has(id) ? 10 : 7}
                      fill={active ? '#eaf1ff' : 'white'}
                      stroke={active || connected ? color : '#c6ccd4'}
                      strokeWidth={active ? 3 : 2}
                    />
                    <circle r="3" fill={color} />
                    <text y="32" textAnchor="middle">
                      {labelLines(node.title).map((line, i) => (
                        <tspan key={i} x="0" dy={i ? 21 : 0}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="map-footnote">
            <span>Drag or scroll to explore · select a thing to follow its connections</span>
            <span>{connections.length} documented relationships</span>
          </div>
        </div>
        <aside className="graph-inspector">
          <div className="selected-story" aria-live="polite">
            <span className="eyebrow">
              {entry.collection}
              {entry.historical ? ' · Archive' : ''}
            </span>
            <h2>{entry.title}</h2>
            <p>{project?.introduction ?? entry.summary}</p>
            <button className="text-link" onClick={() => onOpen(selected)}>
              The story & the build <Icon name="arrow" size={17} />
            </button>
          </div>
          <div className="connection-list">
            <h3>{edges.length ? 'Follow a thread' : 'Keep exploring'}</h3>
            {edges.length ? (
              edges.map((edge) => {
                const other = edge.from === selected ? edge.to : edge.from;
                return (
                  <article key={`${edge.from}:${edge.to}`}>
                    <button onClick={() => setSelected(other)}>
                      {entryById.get(other)!.title}
                      <Icon name="arrow" size={16} />
                    </button>
                    <span className="relationship-direction">
                      {entryById.get(edge.from)!.title} {edge.label} {entryById.get(edge.to)!.title}
                    </span>
                    <p>{edge.detail}</p>
                    <a href={edge.source} target="_blank" rel="noreferrer">
                      Reference <Icon name="external" size={12} />
                    </a>
                  </article>
                );
              })
            ) : (
              <>
                <p className="unlinked-note">
                  This thing has its own story. Its relationships haven’t been mapped yet.
                </p>
                {startingPoints
                  .filter(([, id]) => id !== selected)
                  .slice(0, 3)
                  .map(([title, id]) => (
                    <button className="continue-browsing" key={id} onClick={() => setSelected(id)}>
                      {title}
                      <Icon name="arrow" size={15} />
                    </button>
                  ))}
              </>
            )}
          </div>
          <div className="context-guide">
            <button
              className="guide-toggle"
              aria-expanded={guideExpanded}
              onClick={() => setGuideExpanded(!guideExpanded)}
            >
              <Icon name="spark" size={15} />
              <span>Explore with the AI guide</span>
              <span>{guideExpanded ? '−' : '+'}</span>
            </button>
            {guideExpanded && (
              <div className="context-guide-body">
                <p>A little help following the threads.</p>
                <p className="guide-privacy">
                  Questions and answers go to Amazon Bedrock and private service logs with a 30-day retention policy.
                  Chat history stays in this browser session.
                </p>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    onAsk(question);
                  }}
                >
                  <input
                    aria-label="Ask about selected project"
                    placeholder={`Ask about ${entry.title}…`}
                    value={question}
                    maxLength={1000}
                    onChange={(event) => setQuestion(event.target.value)}
                  />
                  <button aria-label="Ask the guide" disabled={!question.trim() || guideBusy}>
                    <Icon name="arrow" size={16} />
                  </button>
                </form>
                {!guideActive && (
                  <button
                    className="guide-example"
                    onClick={() => onAsk(project?.questions[0] ?? `What is the idea behind ${entry.title}?`)}
                  >
                    {project?.questions[0] ?? `What is the idea behind ${entry.title}?`}
                    <Icon name="arrow" size={13} />
                  </button>
                )}
                {guideContent}
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
