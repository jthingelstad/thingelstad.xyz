import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import type { Collection, GitHubData, Source, Story, Thing } from '../src/data/schema';
import './editor.css';

type Session = { collection: Collection; revision: string; token: string; github: GitHubData };
const blankStory = (): Story => ({
  color: '#426499',
  introduction: '',
  idea: '',
  engineering: [],
  stack: [],
  related: [],
  questions: []
});
const lines = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
async function request<T>(path: string, token?: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: {
      'X-Editor-Request': '1',
      ...(body ? { 'Content-Type': 'application/json', 'X-Editor-Token': token ?? '' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const result = (await response.json()) as T & { message?: string };
  if (!response.ok) throw new Error(result.message ?? 'The request could not be completed.');
  return result;
}
function Editor() {
  const [session, setSession] = useState<Session | null>(null);
  const [draft, setDraft] = useState<Collection | null>(null);
  const [selected, setSelected] = useState('nnxyz');
  const [query, setQuery] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newId, setNewId] = useState('');
  const [newSourceKind, setNewSourceKind] = useState<Source['kind']>('github');
  const [newSourceValue, setNewSourceValue] = useState('');
  const [archiveKind, setArchiveKind] = useState<'blog' | 'weekly_thing' | 'podcast'>('blog');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);
  async function load() {
    const data = await request<Session>('/api/editor');
    setSession(data);
    setDraft(data.collection);
    setDirty(false);
    setError('');
  }
  useEffect(() => {
    let current = true;
    void request<Session>('/api/editor')
      .then((data) => {
        if (current) {
          setSession(data);
          setDraft(data.collection);
        }
      })
      .catch((e: Error) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function change(edit: (copy: Collection) => void) {
    setDraft((current) => {
      if (!current) return current;
      const copy = structuredClone(current);
      edit(copy);
      return copy;
    });
    setDirty(true);
    setMessage('');
    setPreview(false);
  }
  const thing = draft?.things.find((t) => t.id === selected);
  function updateThing(edit: (value: Thing) => void) {
    change((copy) => edit(copy.things.find((t) => t.id === selected)!));
  }
  function updateStory(edit: (value: Story) => void) {
    updateThing((value) => {
      value.story ??= blankStory();
      edit(value.story);
    });
  }
  async function save() {
    if (!session || !draft) return;
    setBusy(true);
    setError('');
    try {
      const result = await request<{ collection: Collection; revision: string }>('/api/editor/save', session.token, {
        collection: draft,
        revision: session.revision
      });
      setSession({ ...session, ...result });
      setDraft(result.collection);
      setDirty(false);
      setMessage('Saved to the collection. These changes are local; review and publish through GitHub.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function refresh(sourceId: string) {
    if (!session) return;
    setBusy(true);
    setError('');
    try {
      const result = await request<{ github: GitHubData }>('/api/editor/refresh', session.token, { sourceId });
      setSession({ ...session, github: result.github });
      setMessage('GitHub evidence refreshed. Your descriptions and history were kept.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function addThing() {
    const id = newId || slug(newTitle);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || !newTitle.trim() || draft?.things.some((t) => t.id === id)) {
      setError('Give the new thing a title and a unique lowercase ID.');
      return;
    }
    change((copy) =>
      copy.things.push({
        id,
        title: newTitle.trim(),
        summary: '',
        collection: 'Experiments',
        url: null,
        historical: false,
        sources: []
      })
    );
    setSelected(id);
    setNewTitle('');
    setNewId('');
    setError('');
  }
  function addSource() {
    let value = newSourceValue.trim();
    if (newSourceKind === 'github') {
      value = value
        .replace(/^https:\/\/github\.com\//, '')
        .replace(/\/$/, '')
        .replace(/\.git$/, '');
      if (!/^[\w-]+\/[\w.-]+$/.test(value)) {
        setError('Paste a GitHub repository URL or owner/repository.');
        return;
      }
    } else {
      try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
      } catch {
        setError('Paste a public HTTPS URL.');
        return;
      }
    }
    const existing = draft?.sources.find(
      (s) =>
        s.kind === newSourceKind &&
        (s.kind === 'github'
          ? s.repository.toLowerCase() === value.toLowerCase()
          : s.url === value && (s.kind !== 'archive' || s.sourceKind === archiveKind))
    );
    const id = existing?.id ?? `${newSourceKind}-${slug(value).slice(0, 70)}`;
    if (thing?.sources.some((a) => a.sourceId === id)) {
      setError('This source is already attached. Add another directory scope using the source picker.');
      return;
    }
    change((copy) => {
      if (!existing)
        copy.sources.push(
          newSourceKind === 'github'
            ? { id, kind: 'github', repository: value }
            : newSourceKind === 'website'
              ? { id, kind: 'website', url: value }
              : { id, kind: 'archive', url: value, sourceKind: archiveKind }
        );
      copy.things
        .find((t) => t.id === selected)!
        .sources.push({ sourceId: id, role: newSourceKind === 'github' ? 'implementation' : newSourceKind });
    });
    setNewSourceValue('');
    setError('');
  }
  if (!draft || !session)
    return (
      <main className="editor-loading">
        <h1>Collection editor</h1>
        <p>{error || 'Opening the collection…'}</p>
      </main>
    );
  return (
    <>
      <header className="editor-header">
        <div>
          <span className="editor-eyebrow">Things I’ve built · Private editor</span>
          <h1>Your collection.</h1>
        </div>
        <div className="editor-actions">
          <span>{dirty ? 'Unsaved changes' : 'Collection saved'}</span>
          <button
            onClick={() => {
              if (!dirty || window.confirm('Discard your unsaved draft and reload?'))
                void load().catch((e: Error) => setError(e.message));
            }}
            disabled={busy}
          >
            Reload saved collection
          </button>
          <button className="primary" onClick={() => void save()} disabled={!dirty || busy}>
            {busy ? 'Working…' : 'Save collection'}
          </button>
        </div>
      </header>
      <div className="editor-notices">
        <p>Save here, review in Git, publish through the site’s delivery workflow.</p>
        {message && (
          <p role="status" className="success">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </div>
      <div className="editor-layout">
        <aside className="editor-sidebar">
          <label className="mobile-picker">
            Choose a thing
            <select
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                setPreview(false);
                setError('');
              }}
            >
              {draft.things.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Find a thing
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or description" />
          </label>
          <nav aria-label="Collection">
            {draft.things
              .filter((t) => `${t.title} ${t.summary}`.toLowerCase().includes(query.toLowerCase()))
              .map((t) => (
                <button
                  key={t.id}
                  aria-current={selected === t.id ? 'page' : undefined}
                  onClick={() => {
                    setSelected(t.id);
                    setPreview(false);
                    setError('');
                  }}
                >
                  {t.title}
                  <small>{t.collection}</small>
                </button>
              ))}
          </nav>
          <details className="new-thing-disclosure">
            <summary>Add a thing</summary>
            <fieldset disabled={busy} className="new-thing">
              <legend>New thing</legend>
              <label>
                New thing title
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </label>
              <label>
                New thing ID
                <input
                  value={newId}
                  placeholder={slug(newTitle) || 'new-thing'}
                  onChange={(e) => setNewId(e.target.value)}
                />
              </label>
              <button onClick={addThing}>Add to collection</button>
            </fieldset>
          </details>
        </aside>
        {thing && (
          <main className="editor-main">
            <div className="editor-section-heading">
              <div>
                <span className="editor-eyebrow">{thing.id}</span>
                <h2>{thing.title}</h2>
              </div>
              <button onClick={() => setPreview(!preview)}>{preview ? 'Back to editing' : 'Preview draft'}</button>
            </div>
            {preview ? (
              <article className="draft-preview">
                <span className="editor-eyebrow">Draft preview · {thing.collection}</span>
                <h2>{thing.title}</h2>
                <p className="preview-intro">{thing.story?.introduction || thing.summary}</p>
                <p>{thing.story?.idea || thing.summary}</p>
                {thing.url && (
                  <a href={thing.url} target="_blank" rel="noreferrer">
                    Visit this thing
                  </a>
                )}
                {thing.story?.engineering.length ? (
                  <>
                    <h3>Inside the build</h3>
                    <ul>
                      {thing.story.engineering.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                    <p>{thing.story.stack.join(' · ')}</p>
                  </>
                ) : null}
                <h3>Connections</h3>
                {draft.connections
                  .filter((edge) => edge.from === thing.id || edge.to === thing.id)
                  .map((edge) => (
                    <p key={`${edge.from}:${edge.to}`}>
                      {draft.things.find((t) => t.id === edge.from)?.title} {edge.label}{' '}
                      {draft.things.find((t) => t.id === edge.to)?.title}
                      <br />
                      {edge.detail}
                    </p>
                  ))}
                <p>{thing.sources.length} attached sources</p>
              </article>
            ) : (
              <fieldset className="editor-fields" disabled={busy}>
                <section>
                  <h3>The thing</h3>
                  <div className="field-grid">
                    <label>
                      Title
                      <input
                        value={thing.title}
                        onChange={(e) =>
                          updateThing((t) => {
                            t.title = e.target.value;
                          })
                        }
                      />
                    </label>
                    <label>
                      Collection
                      <input
                        list="collections"
                        value={thing.collection}
                        onChange={(e) =>
                          updateThing((t) => {
                            t.collection = e.target.value;
                          })
                        }
                      />
                    </label>
                  </div>
                  <datalist id="collections">
                    {[...new Set(draft.things.map((t) => t.collection))].map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  <label>
                    Short description
                    <textarea
                      value={thing.summary}
                      onChange={(e) =>
                        updateThing((t) => {
                          t.summary = e.target.value;
                        })
                      }
                    />
                  </label>
                  <label>
                    Website or public destination
                    <input
                      type="url"
                      value={thing.url ?? ''}
                      onChange={(e) =>
                        updateThing((t) => {
                          t.url = e.target.value || null;
                        })
                      }
                    />
                  </label>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={thing.historical}
                      onChange={(e) =>
                        updateThing((t) => {
                          t.historical = e.target.checked;
                        })
                      }
                    />
                    Historical project
                  </label>
                </section>
                <section>
                  <h3>The story</h3>
                  {!thing.story ? (
                    <button
                      onClick={() =>
                        updateThing((t) => {
                          t.story = blankStory();
                        })
                      }
                    >
                      Add a richer story
                    </button>
                  ) : (
                    <>
                      <label>
                        Introduction
                        <input
                          value={thing.story.introduction}
                          onChange={(e) =>
                            updateStory((s) => {
                              s.introduction = e.target.value;
                            })
                          }
                        />
                      </label>
                      <label>
                        The idea
                        <textarea
                          rows={5}
                          value={thing.story.idea}
                          onChange={(e) =>
                            updateStory((s) => {
                              s.idea = e.target.value;
                            })
                          }
                        />
                      </label>
                      <label>
                        Inside the build · one point per line
                        <textarea
                          rows={5}
                          value={thing.story.engineering.join('\n')}
                          onChange={(e) =>
                            updateStory((s) => {
                              s.engineering = e.target.value.split('\n');
                            })
                          }
                          onBlur={() =>
                            updateStory((s) => {
                              s.engineering = lines(s.engineering.join('\n'));
                            })
                          }
                        />
                      </label>
                      <div className="field-grid">
                        <label>
                          Stack · comma separated
                          <input
                            value={thing.story.stack.join(', ')}
                            onChange={(e) =>
                              updateStory((s) => {
                                s.stack = e.target.value.split(',').map((v) => v.trim());
                              })
                            }
                            onBlur={() =>
                              updateStory((s) => {
                                s.stack = s.stack.filter(Boolean);
                              })
                            }
                          />
                        </label>
                        <label>
                          Project color
                          <input
                            type="color"
                            value={thing.story.color}
                            onChange={(e) =>
                              updateStory((s) => {
                                s.color = e.target.value;
                              })
                            }
                          />
                        </label>
                      </div>
                      <label>
                        Story reference URL
                        <input
                          type="url"
                          value={thing.story.source ?? ''}
                          onChange={(e) =>
                            updateStory((s) => {
                              if (e.target.value) s.source = e.target.value;
                              else delete s.source;
                            })
                          }
                        />
                      </label>
                      <label>
                        Reference label
                        <input
                          value={thing.story.sourceLabel ?? ''}
                          onChange={(e) =>
                            updateStory((s) => {
                              if (e.target.value) s.sourceLabel = e.target.value;
                              else delete s.sourceLabel;
                            })
                          }
                        />
                      </label>
                      <label>
                        Questions for the guide · one per line
                        <textarea
                          value={thing.story.questions.join('\n')}
                          onChange={(e) =>
                            updateStory((s) => {
                              s.questions = e.target.value.split('\n');
                            })
                          }
                          onBlur={() =>
                            updateStory((s) => {
                              s.questions = lines(s.questions.join('\n'));
                            })
                          }
                        />
                      </label>
                    </>
                  )}
                </section>
                <section>
                  <h3>Topics</h3>
                  <div className="topic-checks">
                    {draft.topics.map((topic, index) => (
                      <label key={topic.id} className="check-label">
                        <input
                          type="checkbox"
                          checked={topic.projectIds.includes(thing.id)}
                          onChange={(e) =>
                            change((copy) => {
                              copy.topics[index].projectIds = e.target.checked
                                ? [...copy.topics[index].projectIds, thing.id]
                                : copy.topics[index].projectIds.filter((id) => id !== thing.id);
                            })
                          }
                        />
                        {topic.title}
                      </label>
                    ))}
                  </div>
                  <p className="hint">
                    Shared interests. Add explicit relationships below when two things work together.
                  </p>
                </section>
                <section>
                  <h3>Sources</h3>
                  <p className="hint">
                    Sources can support several things. GitHub evidence is imported separately from your story.
                  </p>
                  {thing.sources.map((attachment, index) => {
                    const source = draft.sources.find((s) => s.id === attachment.sourceId)!;
                    const snapshot = session.github.repositories.find((r) => r.sourceId === source.id);
                    return (
                      <div className="source-card" key={`${index}:${source.id}`}>
                        <div className="source-heading">
                          <strong>{source.kind === 'github' ? source.repository : source.url}</strong>
                          <button
                            aria-label={`Remove source ${index + 1}`}
                            onClick={() =>
                              updateThing((t) => {
                                t.sources.splice(index, 1);
                              })
                            }
                          >
                            Remove
                          </button>
                        </div>
                        <div className="field-grid">
                          <label>
                            {`Source ${index + 1}`}
                            <select
                              value={attachment.sourceId}
                              onChange={(e) =>
                                updateThing((t) => {
                                  t.sources[index].sourceId = e.target.value;
                                  delete t.sources[index].path;
                                })
                              }
                            >
                              {draft.sources.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.kind === 'github' ? s.repository : s.url}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            {`Role ${index + 1}`}
                            <input
                              value={attachment.role}
                              onChange={(e) =>
                                updateThing((t) => {
                                  t.sources[index].role = e.target.value;
                                })
                              }
                            />
                          </label>
                        </div>
                        {source.kind === 'github' ? (
                          <>
                            <label>
                              {`Directory scope ${index + 1}`}
                              <input
                                value={attachment.path ?? ''}
                                placeholder="Whole repository"
                                onChange={(e) =>
                                  updateThing((t) => {
                                    if (e.target.value) t.sources[index].path = e.target.value;
                                    else delete t.sources[index].path;
                                  })
                                }
                              />
                            </label>
                            <div className="source-refresh">
                              <button disabled={dirty || busy} onClick={() => void refresh(source.id)}>
                                Refresh GitHub evidence
                              </button>
                              <span>
                                {snapshot
                                  ? `Observed ${new Date(snapshot.fetchedAt).toLocaleDateString()}`
                                  : 'No snapshot yet'}
                              </span>
                            </div>
                            {dirty && <p className="hint">Save the collection before refreshing.</p>}
                          </>
                        ) : source.kind === 'website' ? (
                          <>
                            <label>
                              Sitemap URL
                              <input
                                type="url"
                                value={source.sitemap ?? ''}
                                placeholder="https://example.com/sitemap.xml"
                                onChange={(e) =>
                                  change((copy) => {
                                    const s = copy.sources.find((s) => s.id === source.id);
                                    if (s?.kind === 'website') {
                                      if (e.target.value) s.sitemap = e.target.value;
                                      else delete s.sitemap;
                                    }
                                  })
                                }
                              />
                            </label>
                            <p className="hint">
                              Website indexing is a future source adapter. Sitemap dates will describe reported
                              modification, not launch.
                            </p>
                          </>
                        ) : (
                          <p className="hint">Archive attachment saved for future publishing statistics.</p>
                        )}
                      </div>
                    );
                  })}
                  <div className="field-grid">
                    <label>
                      New source type
                      <select
                        value={newSourceKind}
                        onChange={(e) => setNewSourceKind(e.target.value as Source['kind'])}
                      >
                        <option value="github">GitHub repository</option>
                        <option value="website">Website</option>
                        <option value="archive">Publishing archive</option>
                      </select>
                    </label>
                    <label>
                      New source address
                      <input
                        value={newSourceValue}
                        placeholder={newSourceKind === 'github' ? 'GitHub URL or owner/repository' : 'https://…'}
                        onChange={(e) => setNewSourceValue(e.target.value)}
                      />
                    </label>
                  </div>
                  {newSourceKind === 'archive' && (
                    <label>
                      Archive content
                      <select
                        value={archiveKind}
                        onChange={(e) => setArchiveKind(e.target.value as typeof archiveKind)}
                      >
                        <option value="blog">Blog</option>
                        <option value="weekly_thing">Weekly Thing</option>
                        <option value="podcast">Podcast</option>
                      </select>
                    </label>
                  )}
                  <div className="inline-actions">
                    <button onClick={addSource}>Attach source</button>
                    <button
                      onClick={() =>
                        updateThing((t) => {
                          if (draft.sources[0])
                            t.sources.push({ sourceId: draft.sources[0].id, role: 'implementation' });
                        })
                      }
                    >
                      Attach an existing source
                    </button>
                  </div>
                </section>
                <section>
                  <h3>Connections</h3>
                  {draft.connections.map((edge, index) =>
                    edge.from !== thing.id && edge.to !== thing.id ? null : (
                      <div className="connection-card" key={index}>
                        <div className="source-heading">
                          <strong>
                            {draft.things.find((t) => t.id === edge.from)?.title} {edge.label}{' '}
                            {draft.things.find((t) => t.id === edge.to)?.title}
                          </strong>
                          <button
                            aria-label={`Remove connection ${index + 1}`}
                            onClick={() =>
                              change((copy) => {
                                copy.connections.splice(index, 1);
                              })
                            }
                          >
                            Remove
                          </button>
                        </div>
                        <div className="field-grid">
                          {(['from', 'to'] as const).map((end) => (
                            <label key={end}>
                              {end === 'from' ? 'From' : 'To'}
                              <select
                                value={edge[end]}
                                onChange={(e) =>
                                  change((copy) => {
                                    copy.connections[index][end] = e.target.value;
                                  })
                                }
                              >
                                {draft.things.map((t) => (
                                  <option value={t.id} key={t.id}>
                                    {t.title}
                                  </option>
                                ))}
                              </select>
                            </label>
                          ))}
                        </div>
                        <label>
                          Relationship
                          <input
                            value={edge.label}
                            placeholder="powers, publishes, grew into…"
                            onChange={(e) =>
                              change((copy) => {
                                copy.connections[index].label = e.target.value;
                              })
                            }
                          />
                        </label>
                        <label>
                          Explanation
                          <textarea
                            value={edge.detail}
                            onChange={(e) =>
                              change((copy) => {
                                copy.connections[index].detail = e.target.value;
                              })
                            }
                          />
                        </label>
                        <label>
                          Supporting reference
                          <input
                            type="url"
                            value={edge.source}
                            onChange={(e) =>
                              change((copy) => {
                                copy.connections[index].source = e.target.value;
                              })
                            }
                          />
                        </label>
                        <label className="check-label">
                          <input
                            type="checkbox"
                            checked={edge.kind === 'lineage'}
                            onChange={(e) =>
                              change((copy) => {
                                if (e.target.checked) copy.connections[index].kind = 'lineage';
                                else delete copy.connections[index].kind;
                              })
                            }
                          />
                          Evolution or succession
                        </label>
                      </div>
                    )
                  )}
                  <button
                    onClick={() =>
                      change((copy) => {
                        const other = copy.things.find((t) => t.id !== thing.id);
                        if (other)
                          copy.connections.push({
                            from: thing.id,
                            to: other.id,
                            label: '',
                            detail: '',
                            source: thing.url ?? ''
                          });
                      })
                    }
                  >
                    Add a connection
                  </button>
                </section>
                <section>
                  <h3>Documented history</h3>
                  <p className="hint">
                    Dates may be a year, month, or day. Recorded development is different from a launch.
                  </p>
                  {draft.history.map((event, index) =>
                    !event.projectIds.includes(thing.id) ? null : (
                      <div className="event-card" key={event.id}>
                        <strong>{event.id}</strong>
                        <div className="field-grid">
                          <label>
                            Event date
                            <input
                              value={event.date}
                              placeholder="YYYY-MM-DD"
                              onChange={(e) =>
                                change((copy) => {
                                  copy.history[index].date = e.target.value;
                                })
                              }
                            />
                          </label>
                          <label>
                            Event kind
                            <select
                              value={event.kind}
                              onChange={(e) =>
                                change((copy) => {
                                  copy.history[index].kind = e.target.value as typeof event.kind;
                                })
                              }
                            >
                              {['launch', 'milestone', 'development', 'retirement', 'archive'].map((kind) => (
                                <option key={kind}>{kind}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <label>
                          Event title
                          <input
                            value={event.title}
                            onChange={(e) =>
                              change((copy) => {
                                copy.history[index].title = e.target.value;
                              })
                            }
                          />
                        </label>
                        <label>
                          Event summary
                          <textarea
                            value={event.summary}
                            onChange={(e) =>
                              change((copy) => {
                                copy.history[index].summary = e.target.value;
                              })
                            }
                          />
                        </label>
                        <label>
                          Event reference
                          <input
                            type="url"
                            value={event.source}
                            onChange={(e) =>
                              change((copy) => {
                                copy.history[index].source = e.target.value;
                              })
                            }
                          />
                        </label>
                        {event.projectIds.length > 1 && (
                          <p className="hint">
                            Shared event:{' '}
                            {event.projectIds.map((id) => draft.things.find((t) => t.id === id)?.title).join(', ')}
                          </p>
                        )}
                        <button
                          onClick={() =>
                            change((copy) => {
                              copy.history.splice(index, 1);
                            })
                          }
                        >
                          Remove event
                        </button>
                      </div>
                    )
                  )}
                  <button
                    onClick={() =>
                      change((copy) =>
                        copy.history.push({
                          id: `${thing.id}-${crypto.randomUUID().slice(0, 8)}`,
                          projectIds: [thing.id],
                          date: '',
                          kind: 'milestone',
                          title: '',
                          summary: '',
                          source: thing.url ?? ''
                        })
                      )
                    }
                  >
                    Add a sourced event
                  </button>
                </section>
              </fieldset>
            )}
          </main>
        )}
      </div>
    </>
  );
}
createRoot(document.getElementById('root')!).render(<Editor />);
