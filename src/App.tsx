import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { catalog, entryById, searchProjects } from './data/projects';
import { Connections } from './components/Connections';
import { ProjectDetail } from './components/ProjectDetail';
import { Icon } from './components/Icon';
import { History } from './components/History';
import { historyYears } from './data/history';
import { topicById } from './data/topics';
import { askGuide, type GuideResult } from './lib/guide';

declare global {
  interface Window {
    tinylytics?: { triggerUpdate?: () => void };
  }
}

type View = 'connections' | 'history' | 'index' | 'about';
type Route = {
  view: View;
  project: string | null;
  focus: string;
  layout: 'timeline' | 'map';
  topic: string | null;
  year: number;
  month: number | null;
};
function readLocation(): Route {
  const params = new URLSearchParams(location.search);
  const topic = topicById.get(params.get('topic') ?? '');
  return {
    view: (['index', 'about', 'history'].includes(params.get('view') ?? '')
      ? params.get('view')
      : 'connections') as View,
    project: entryById.has(params.get('project') ?? '') ? params.get('project') : null,
    focus: entryById.has(params.get('focus') ?? '') ? params.get('focus')! : (topic?.projectIds[0] ?? 'wt-builder'),
    layout: params.get('layout') === 'map' ? 'map' : 'timeline',
    topic: topicById.has(params.get('topic') ?? '') ? params.get('topic') : null,
    year: historyYears.includes(Number(params.get('year'))) ? Number(params.get('year')) : historyYears[0],
    month:
      params.has('month') &&
      Number(params.get('month')) >= 1 &&
      Number(params.get('month')) <= 12 &&
      Number.isInteger(Number(params.get('month')))
        ? Number(params.get('month'))
        : null
  };
}

export function App() {
  const [route, setRoute] = useState(readLocation);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<GuideResult | null>(null);
  const [thinking, setThinking] = useState('');
  const [error, setError] = useState('');
  const [indexQuery, setIndexQuery] = useState('');
  const [collection, setCollection] = useState('All');
  const abort = useRef<AbortController | null>(null);
  const history = useRef<{ question: string; answer: string }[]>([]);
  const reduced = useReducedMotion();

  useEffect(() => {
    window.tinylytics?.triggerUpdate?.();
  }, [route.view, route.project, route.focus, route.layout, route.topic, route.year, route.month]);
  useEffect(() => {
    const onPop = () => setRoute(readLocation());
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      abort.current?.abort();
    };
  }, []);
  const navigate = useCallback(
    (view: View, project: string | null = null, focus = route.focus, options: Partial<Route> = {}) => {
      const next = { ...route, view, project, focus, ...options };
      const params = new URLSearchParams();
      if (view !== 'connections') params.set('view', view);
      if (project) params.set('project', project);
      if (focus !== 'wt-builder') params.set('focus', focus);
      if (next.layout === 'map') params.set('layout', 'map');
      if (next.topic) params.set('topic', next.topic);
      if (next.year !== historyYears[0]) params.set('year', String(next.year));
      if (next.month) params.set('month', String(next.month));
      window.history.pushState({}, '', params.size ? `?${params}` : location.pathname);
      if (view !== route.view || project !== route.project) window.scrollTo({ top: 0, behavior: 'instant' });
      setRoute(next);
    },
    [route]
  );
  function open(id: string) {
    navigate(route.view, id);
  }
  function select(id: string) {
    navigate('connections', null, id);
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && route.project) navigate(route.view);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [route, navigate]);

  async function explore(query: string) {
    if (!query.trim()) return;
    const context = route.project ?? route.focus;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setQuestion(query);
    setThinking('Following the connections…');
    setError('');
    setResult(null);
    navigate('connections', null, context);
    try {
      await askGuide(query, history.current, context, controller.signal, (event) => {
        if (controller.signal.aborted) return;
        if (event.type === 'thinking') setThinking(event.text);
        if (event.type === 'result') {
          setResult(event.result);
          setThinking('');
          history.current = [...history.current, { question: query, answer: event.result.message }].slice(-4);
        }
        if (event.type === 'error') {
          setError(event.message);
          setThinking('');
        }
      });
    } catch (exception) {
      if (!controller.signal.aborted) {
        setError(exception instanceof Error ? exception.message : 'The guide could not connect.');
        setThinking('');
      }
    }
  }
  function resetGuide() {
    abort.current?.abort();
    setQuestion('');
    setThinking('');
    setError('');
    setResult(null);
  }
  function reset() {
    resetGuide();
    navigate('connections', null, 'wt-builder', {
      layout: 'timeline',
      topic: null,
      year: historyYears[0],
      month: null
    });
  }
  const guideContent =
    thinking || error || result ? (
      <div className="guide-region" aria-live="polite" aria-busy={!!thinking}>
        <p className="guide-question">{question}</p>
        {thinking && (
          <div className="guide-thinking">
            <span className="thinking-dot" />
            {thinking}
            <button
              onClick={() => {
                abort.current?.abort();
                setThinking('');
              }}
            >
              Cancel
            </button>
          </div>
        )}
        {error && (
          <div className="guide-answer guide-error">
            <p>{error}</p>
            <button className="text-link" onClick={resetGuide}>
              Keep browsing <Icon name="arrow" size={15} />
            </button>
          </div>
        )}
        {result && (
          <motion.div
            className="guide-answer"
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p>{result.message}</p>
            <div className="guide-projects">
              {result.projectIds.map((id) => (
                <button key={id} onClick={() => select(id)}>
                  {entryById.get(id)!.title}
                  <Icon name="arrow" size={13} />
                </button>
              ))}
            </div>
            <div className="guide-followups">
              {result.suggestions.map((query) => (
                <button key={query} onClick={() => void explore(query)}>
                  {query}
                  <Icon name="arrow" size={13} />
                </button>
              ))}
            </div>
            <span className="guide-credit">AI guide · grounded in this collection</span>
          </motion.div>
        )}
      </div>
    ) : null;
  const indexEntries = searchProjects(indexQuery).filter(
    (entry) => collection === 'All' || entry.collection === collection
  );

  return (
    <>
      <header className="site-header">
        <button className="wordmark" onClick={reset}>
          Jamie Thingelstad
        </button>
        <nav aria-label="Main navigation">
          <button
            aria-current={route.view === 'connections' ? 'page' : undefined}
            onClick={() => navigate('connections')}
          >
            Explore
          </button>
          <button aria-current={route.view === 'history' ? 'page' : undefined} onClick={() => navigate('history')}>
            History
          </button>
          <button aria-current={route.view === 'index' ? 'page' : undefined} onClick={() => navigate('index')}>
            Index
          </button>
          <button aria-current={route.view === 'about' ? 'page' : undefined} onClick={() => navigate('about')}>
            About
          </button>
        </nav>
      </header>
      <main id="main">
        {route.project ? (
          <ProjectDetail
            key={route.project}
            id={route.project}
            onOpen={open}
            onAsk={(query) => void explore(query)}
            onBack={() => navigate(route.view)}
          />
        ) : route.view === 'connections' ? (
          <Connections
            onOpen={open}
            selected={route.focus}
            layout={route.layout}
            topic={route.topic}
            onLayout={(layout) => navigate('connections', null, route.focus, { layout })}
            onTopic={(topic) => {
              const members = topic ? topicById.get(topic)!.projectIds : null;
              navigate('connections', null, members && !members.includes(route.focus) ? members[0] : route.focus, {
                topic
              });
            }}
            onHistory={(year) => navigate('history', null, route.focus, { year, month: null })}
            setSelected={select}
            onAsk={(query) => void explore(query)}
            guideContent={guideContent}
            guideActive={!!(thinking || error || result)}
            guideBusy={!!thinking}
          />
        ) : route.view === 'history' ? (
          <History
            year={route.year}
            month={route.month}
            topic={route.topic}
            onFilter={(year, month) => navigate('history', null, route.focus, { year, month })}
            onTopic={(topic) => navigate('history', null, route.focus, { topic, month: null })}
            onSelect={select}
          />
        ) : route.view === 'index' ? (
          <section className="index-view">
            <div className="page-intro">
              <span className="eyebrow">The whole collection</span>
              <h1>An index of things.</h1>
              <p>
                Websites, tools, communities, and experiments.
                <br />
                Some are live. Some are part of the story.
              </p>
            </div>
            <div className="index-tools">
              <input
                aria-label="Search the index"
                placeholder="Find a thing…"
                value={indexQuery}
                onChange={(event) => setIndexQuery(event.target.value)}
              />
              <select
                aria-label="Filter collection"
                value={collection}
                onChange={(event) => setCollection(event.target.value)}
              >
                {['All', ...new Set(catalog.map((entry) => entry.collection))].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              <span>{indexEntries.length} things</span>
            </div>
            <div className="index-list">
              {indexEntries.map((entry) => (
                <button className="index-row" key={entry.id} onClick={() => open(entry.id)}>
                  <span>
                    <strong>{entry.title}</strong>
                    <span>{entry.summary}</span>
                  </span>
                  <span className="index-category">
                    {entry.collection}
                    {entry.historical && <small>Archive</small>}
                  </span>
                  <Icon name="arrow" size={19} />
                </button>
              ))}
            </div>
            {!indexEntries.length && <p className="empty-state">No things match that search. Try another word.</p>}
            <p className="quiet-note">
              The index includes projects, platform features, and recovered history. Unresolved archive candidates
              remain in the research inventory.
            </p>
          </section>
        ) : (
          <section className="about-view">
            <span className="eyebrow">Jamie Thingelstad</span>
            <h1>I like building things.</h1>
            <p className="about-lead">
              Technology is my work.
              <br />
              Curiosity keeps it interesting.
            </p>
            <p>
              I’m a CTO and a passionate technologist. This is a place for the things I’ve built: the tools, the games,
              the communities, and the ideas that kept growing.
            </p>
            <p>Choose a thing. Follow a connection. Ask the guide to find a thread you might have missed.</p>
            <div className="detail-links">
              <a href="https://www.thingelstad.com/" target="_blank" rel="noreferrer">
                Read my blog <Icon name="external" size={15} />
              </a>
              <a href="https://github.com/jthingelstad" target="_blank" rel="noreferrer">
                GitHub <Icon name="external" size={15} />
              </a>
            </div>
            <button className="text-link" onClick={() => navigate('connections')}>
              See how things connect <Icon name="arrow" size={17} />
            </button>
          </section>
        )}
      </main>
      <footer className="site-footer">
        <span>Made with curiosity.</span>
        <span>Jamie Thingelstad</span>
      </footer>
    </>
  );
}
