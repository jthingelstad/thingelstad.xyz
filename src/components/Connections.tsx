import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { connections, graphHeight, graphPositions, neighbors } from '../data/connections';
import { catalog, entryById, projectById } from '../data/projects';
import { Icon } from './Icon';
import { useCompactGraph } from '../lib/useCompactGraph';
import { TopicPicker } from './TopicPicker';
import { topicById, topicsFor } from '../data/topics';
import {
  timelineLayout,
  compactTimelineLayout,
  historyEvents,
  eventsForProject,
  formatEventDate
} from '../data/history';

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
  layout: 'timeline' | 'map';
  topic: string | null;
  onLayout: (layout: 'timeline' | 'map') => void;
  onTopic: (id: string | null) => void;
  onHistory: (year: number) => void;
  selected: string;
  setSelected: (id: string) => void;
  onAsk: (question: string) => void;
  guideContent: ReactNode;
  guideActive: boolean;
  guideBusy: boolean;
};

export function Connections({
  onOpen,
  selected,
  setSelected,
  onAsk,
  guideContent,
  guideActive,
  guideBusy,
  layout,
  topic,
  onLayout,
  onTopic,
  onHistory
}: Props) {
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
  const compact = useCompactGraph();
  const timeLayout = compact ? compactTimelineLayout : timelineLayout;
  const { bands: timelineBands, eventPositions } = timeLayout;
  const positions = layout === 'timeline' ? timeLayout.positions : graphPositions;
  const height = layout === 'timeline' ? timeLayout.height : graphHeight;
  const width = layout === 'timeline' ? timeLayout.width : 1200;
  const activeTopic = topic ? topicById.get(topic)! : null;
  const topicMembers = activeTopic?.projectIds ?? null;
  const hubY = positions[topicMembers?.includes(selected) ? selected : (topicMembers?.[0] ?? selected)][1] + 80;
  const projectEvents = eventsForProject(selected);
  const projectTopics = topicsFor(selected);
  const edges = connections.filter((edge) => edge.from === selected || edge.to === selected);

  useEffect(() => {
    const area = canvas.current,
      svg = area?.querySelector('svg');
    if (!area || !svg) return;
    const params = new URLSearchParams(location.search);
    if (!params.has('focus') && !params.has('topic') && zoom === 1 && area.scrollTop === 0 && area.scrollLeft === 0)
      return;
    const scale = svg.getBoundingClientRect().width / width;
    const [x, y] = positions[selected];
    area.scrollTo({
      left: Math.max(0, x * scale - area.clientWidth / 2),
      top: Math.max(0, y * scale - area.clientHeight / 2),
      behavior: reduced ? 'instant' : 'smooth'
    });
  }, [selected, zoom, reduced, positions, width]);
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
          <p>Follow an interest. Trace an idea. Travel back through the things.</p>
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
      <TopicPicker selected={topic} onChange={onTopic} />
      <div className="map-mode-row">
        <div className="map-modes" aria-label="Graph layout">
          <button aria-pressed={layout === 'timeline'} onClick={() => onLayout('timeline')}>
            Through time
          </button>
          <button aria-pressed={layout === 'map'} onClick={() => onLayout('map')}>
            Connections
          </button>
        </div>
        <span>
          {layout === 'timeline'
            ? 'Latest documented activity first · scroll back in time'
            : 'Every thing, and the threads between them'}
        </span>
      </div>
      <div className="graph-layout">
        <div className={`graph-stage${layout === 'timeline' ? ' timeline-stage' : ''}`}>
          <div className="graph-controls">
            <select aria-label="Choose a project" value={selected} onChange={(e) => setSelected(e.target.value)}>
              {catalog.map((node) => (
                <option value={node.id} key={node.id}>
                  {node.title}
                </option>
              ))}
            </select>
            {layout === 'timeline' && (
              <select
                aria-label="Jump to year"
                value=""
                onChange={(event) => {
                  const band = timelineBands.find((item) => String(item.year ?? 'undated') === event.target.value);
                  if (band && canvas.current)
                    canvas.current.scrollTo({
                      top: (band.y * canvas.current.querySelector('svg')!.getBoundingClientRect().width) / width,
                      behavior: reduced ? 'instant' : 'smooth'
                    });
                }}
              >
                <option value="" disabled>
                  Jump to year
                </option>
                {timelineBands.map((band) => (
                  <option key={band.year ?? 'undated'} value={band.year ?? 'undated'}>
                    {band.year ?? 'Undated'}
                  </option>
                ))}
              </select>
            )}
            <button
              className="graph-zoom-control"
              aria-label="Zoom out"
              disabled={zoom <= 0.75}
              onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
            >
              −
            </button>
            <button
              className="graph-zoom-control"
              aria-label="Zoom in"
              disabled={zoom >= 2}
              onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
            >
              +
            </button>
            <button className="graph-zoom-control" onClick={() => setZoom(1)}>
              Reset
            </button>
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
                (event.target as Element).closest('[role=button]')
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
              viewBox={`0 0 ${width} ${height}`}
              style={{ width: `${compact && layout === 'timeline' ? 100 : zoom * 100}%` }}
              aria-label="Project relationships"
            >
              <defs>
                <marker
                  id="lineage-arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#3373ee" strokeWidth="1.5" />
                </marker>
                <marker
                  id="lineage-arrow-muted"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#899bb8" strokeWidth="1.5" />
                </marker>
              </defs>
              {layout === 'timeline' ? (
                timelineBands.map((band) => (
                  <g
                    key={band.year ?? 'undated'}
                    className="time-band"
                    aria-label={band.year ? `Year ${band.year}` : 'Dates not yet established'}
                  >
                    <line x1="38" x2={width - 38} y1={band.y + 32} y2={band.y + 32} />
                    <text x="38" y={band.y + 62}>
                      {band.year ?? 'Undated'}
                    </text>
                    <text className="time-band-note" x="155" y={band.y + 61}>
                      {band.year === timelineBands[0].year
                        ? 'LATEST DOCUMENTED ACTIVITY'
                        : band.year
                          ? 'EARLIER CHAPTERS'
                          : 'STORIES STILL TO DATE'}
                    </text>
                  </g>
                ))
              ) : (
                <>
                  <text className="map-region-label" x="110" y="40">
                    WRITING, TOOLS & PUBLISHING
                  </text>
                  <text className="map-region-label" x="690" y="40">
                    GAMES, AGENTS & COMMUNITIES
                  </text>
                  <text className="map-region-label" x="110" y="750">
                    MORE THINGS TO EXPLORE
                  </text>
                </>
              )}
              {activeTopic && (
                <g className="topic-hub">
                  {activeTopic.projectIds.map((id) => {
                    const point = positions[id];
                    return (
                      <path
                        key={id}
                        className="topic-thread"
                        d={`M 65 ${hubY} Q 65 ${point[1]} ${point[0] - 20} ${point[1]}`}
                      />
                    );
                  })}
                  <g
                    transform={`translate(65 ${hubY})`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Clear ${activeTopic.title} topic`}
                    onClick={() => onTopic(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onTopic(null);
                      }
                    }}
                  >
                    <circle r="24" fill="transparent" />
                    <rect className="topic-diamond" x="-6" y="-6" width="12" height="12" transform="rotate(45)" />
                    <text x="16" y="4">
                      {activeTopic.title}
                    </text>
                  </g>
                </g>
              )}
              {layout === 'timeline' &&
                Object.entries(eventPositions).map(([id, [x, y]]) => {
                  const event = historyEvents.find((entry) => entry.id === id)!;
                  const active = event.projectIds.includes(selected);
                  const visible =
                    !topicMembers || event.projectIds.some((projectId) => topicMembers.includes(projectId));
                  const a = positions[selected];
                  return (
                    <g key={id} className={`timeline-echo${active ? ' active' : ''}`} opacity={visible ? 1 : 0.2}>
                      {active && (
                        <path
                          className="life-thread"
                          d={`M ${a[0]} ${a[1] + 20} C ${a[0] - 80} ${a[1] + 80}, ${x - 80} ${y - 80}, ${x} ${y}`}
                        />
                      )}
                      <g
                        transform={`translate(${x} ${y})`}
                        role="button"
                        tabIndex={0}
                        aria-label={`Explore history: ${event.title}`}
                        onClick={() => onHistory(Number(event.date.slice(0, 4)))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onHistory(Number(event.date.slice(0, 4)));
                          }
                        }}
                      >
                        <circle r="24" fill="transparent" />
                        <circle r="5" />
                        <text y="25" textAnchor="middle">
                          {labelLines(event.title).map((line, index) => (
                            <tspan key={index} x="0" dy={index ? 18 : 0}>
                              {line}
                            </tspan>
                          ))}
                        </text>
                      </g>
                    </g>
                  );
                })}
              {connections.map((edge, index) => {
                const a = positions[edge.from],
                  b = positions[edge.to];
                const control =
                  compact && layout === 'timeline'
                    ? [a[0] + (edge.kind === 'lineage' ? 115 : -115), (a[1] + b[1]) / 2]
                    : [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 60];
                const length = Math.hypot(b[0] - control[0], b[1] - control[1]) || 1;
                const end = [b[0] - ((b[0] - control[0]) / length) * 20, b[1] - ((b[1] - control[1]) / length) * 20];
                const active = edge.from === selected || edge.to === selected;
                const visible =
                  (!topicMembers || (topicMembers.includes(edge.from) && topicMembers.includes(edge.to))) &&
                  (!compact || layout === 'map' || active);
                return (
                  <motion.path
                    key={`${edge.from}:${edge.to}`}
                    className={edge.kind === 'lineage' ? 'lineage-edge' : 'relationship-edge'}
                    data-from={edge.from}
                    data-to={edge.to}
                    aria-label={`${entryById.get(edge.from)!.title} ${edge.label} ${entryById.get(edge.to)!.title}`}
                    d={`M ${a[0]} ${a[1]} Q ${control[0]} ${control[1]} ${end[0]} ${end[1]}`}
                    markerEnd={
                      edge.kind === 'lineage' ? `url(#${active ? 'lineage-arrow' : 'lineage-arrow-muted'})` : undefined
                    }
                    strokeDasharray={edge.kind === 'lineage' ? '6 5' : undefined}
                    fill="none"
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{
                      stroke: active ? '#3373ee' : edge.kind === 'lineage' ? '#899bb8' : '#dce2eb',
                      strokeWidth: active ? 2.5 : 1.3,
                      opacity: visible ? (active ? 1 : edge.kind === 'lineage' ? 0.65 : 0.35) : 0.06
                    }}
                    transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : index * 0.008 }}
                  />
                );
              })}
              {Object.entries(positions).map(([id, [x, y]]) => {
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
                    className={`graph-node${active ? ' selected' : ''}${connected ? ' connected' : ''}${topicMembers && !topicMembers.includes(id) ? ' topic-muted' : ''}`}
                    data-project-id={id}
                  >
                    <circle className="node-hit" r="25" fill="transparent" />
                    <motion.circle
                      animate={{ r: active ? 16 : projectById.has(id) ? 10 : 7 }}
                      transition={{ duration: reduced ? 0 : 0.25 }}
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
            <span>
              <i className="lineage-key" /> Evolution <i className="relation-key" /> Connection
            </span>
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
          <div className="project-topics" aria-label="Selected project topics">
            {projectTopics.map((item) => (
              <button
                key={item.id}
                aria-pressed={topic === item.id}
                onClick={() => onTopic(topic === item.id ? null : item.id)}
              >
                {item.title}
              </button>
            ))}
          </div>
          <div className="project-history">
            <h3>Through time</h3>
            {projectEvents.length ? (
              <>
                {projectEvents.slice(0, 3).map((event) => (
                  <a key={event.id} href={event.source} target="_blank" rel="noreferrer">
                    <time dateTime={event.date}>{formatEventDate(event.date)}</time>
                    <span>
                      {event.title}
                      <Icon name="external" size={11} />
                    </span>
                  </a>
                ))}
                <button className="text-link" onClick={() => onHistory(Number(projectEvents[0].date.slice(0, 4)))}>
                  Explore the shared history <Icon name="arrow" size={13} />
                </button>
              </>
            ) : (
              <p>Its dates haven’t been established yet.</p>
            )}
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
                      {edge.kind === 'lineage' && <strong className="lineage-label">Evolution · </strong>}
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
