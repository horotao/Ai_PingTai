'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { getAvailableSizes, getModelSpec, MODELS, QUICK_PROMPTS, clsx, fmtTime, hueFor } from '../_lib/data';
import { useStore, type DiagnosticEntry, type RefImage, type Turn } from '../_lib/store';
import { downloadImage, proxiedImage, readFileAsDataURL } from '../_lib/apimart';
import { I } from './Icons';

function Composer({ hasKey, onSubmit }: { hasKey: boolean; onSubmit: (p: { prompt: string; refs: RefImage[]; model: string; ratio: string; n: number }) => void; }) {
  const { tweaks, model, setModel, ratio, setRatio, n, setN, adv, setDrawerOpen, turns } = useStore();
  const floating = tweaks.floating && turns.length === 0;
  const [prompt, setPrompt] = useState('');
  const [refs, setRefs] = useState<RefImage[]>([]);
  const [modelOpen, setModelOpen] = useState(false);
  const [ratioOpen, setRatioOpen] = useState(false);
  const [drag, setDrag] = useState(false);
  const [refError, setRefError] = useState('');
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = () => {
      try {
        const saved = localStorage.getItem('draft_prompt');
        if (saved) setPrompt(saved);
      } catch {}
    };
    load();
    window.addEventListener('draft-reload', load);
    return () => window.removeEventListener('draft-reload', load);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('draft_prompt', prompt);
    } catch {}
  }, [prompt]);

  useEffect(() => {
    const t = taRef.current;
    if (!t) return;
    t.style.height = 'auto';
    t.style.height = `${Math.min(t.scrollHeight, 240)}px`;
  }, [prompt]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.('.qb')) {
        setModelOpen(false);
        setRatioOpen(false);
      }
    };
    window.addEventListener('click', h);
    return () => window.removeEventListener('click', h);
  }, []);

  const modelSpec = getModelSpec(model);
  const availableSizes = getAvailableSizes(modelSpec, adv.resolution);
  const maxRefs = modelSpec.maxRefs;
  const maxFileSize = modelSpec.maxFileSizeMb * 1024 * 1024;
  const canSubmit = hasKey && prompt.trim().length > 0;

  function chooseModel(nextModel: string) {
    const nextSpec = getModelSpec(nextModel);
    const nextSizes = getAvailableSizes(nextSpec, adv.resolution);
    setModel(nextModel);
    if (!nextSizes.includes(ratio)) setRatio(nextSizes[0]);
    if (n > nextSpec.maxN) setN(nextSpec.maxN);
  }

  async function addFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const next: RefImage[] = [...refs];
    setRefError('');

    for (const file of arr) {
      if (next.length >= maxRefs) {
        setRefError(`Up to ${maxRefs} reference images are allowed.`);
        break;
      }
      if (!file.type.startsWith('image/')) {
        setRefError(`${file.name} is not an image.`);
        continue;
      }
      if (file.size > maxFileSize) {
        setRefError(`${file.name} exceeds ${modelSpec.maxFileSizeMb}MB.`);
        continue;
      }

      try {
        const dataUrl = await readFileAsDataURL(file);
        next.push({
          id: `r-${Math.random().toString(36).slice(2, 10)}`,
          hue: Math.floor(Math.random() * 360),
          name: file.name,
          size: file.size,
          dataUrl,
        });
      } catch {
        setRefError(`Failed to read ${file.name}.`);
      }
    }

    setRefs(next);
  }

  function removeRef(id: string) {
    setRefs(refs.filter((ref) => ref.id !== id));
  }

  function submit() {
    if (!canSubmit) return;
    onSubmit({ prompt: prompt.trim(), refs, model, ratio, n });
    setPrompt('');
    setRefs([]);
    setRefError('');
    try {
      localStorage.setItem('draft_prompt', '');
    } catch {}
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="composer-wrap">
      <div
        className={clsx('composer', floating && 'floating', drag && 'drag')}
        onDragOver={(e) => { e.preventDefault(); if (hasKey) setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (hasKey && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
      >
        {refs.length > 0 ? (
          <div className="composer-refs">
            {refs.map((ref) => (
              <div
                key={ref.id}
                className="ref-thumb"
                title={ref.name}
                style={ref.dataUrl || ref.url
                  ? { backgroundImage: `url(${ref.dataUrl || ref.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: `repeating-linear-gradient(45deg, oklch(0.3 0.04 ${ref.hue}) 0 6px, oklch(0.38 0.05 ${ref.hue}) 6px 8px)` }}
              >
                <button className="x" onClick={() => removeRef(ref.id)}><I.X style={{ width: 10, height: 10 }} /></button>
              </div>
            ))}
          </div>
        ) : null}

        {refError ? <div style={{ fontSize: 11, color: 'var(--danger)', padding: '0 14px 4px' }}>{refError}</div> : null}

        <div className="composer-row">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
          />
          <button className="icon-btn" onClick={() => fileRef.current?.click()} disabled={!hasKey || refs.length >= maxRefs} title="Upload references">
            <I.Paperclip />
          </button>
          <textarea
            ref={taRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onKey}
            disabled={!hasKey}
            placeholder={hasKey ? 'Describe the image you want... (Shift+Enter for newline)' : 'Add your Apimart API Key in Settings first'}
            rows={1}
          />
          <button className="send-btn" onClick={submit} disabled={!canSubmit} title="Submit (Enter)">
            <I.Send />
          </button>
        </div>

        <div className="quickbar">
          <div className="qb" onClick={(e) => { e.stopPropagation(); setModelOpen((v) => !v); setRatioOpen(false); }}>
            <I.Sparkles />
            <span className="v">{modelSpec.label}</span>
            <I.Chevron style={{ width: 11, height: 11, opacity: 0.5 }} />
            {modelOpen ? (
              <div className="dropdown">
                <div className="dd-section">Model</div>
                {Object.entries(MODELS).map(([key, spec]) => (
                  <div key={key} className={clsx('dd-item', key === model && 'active')} onClick={() => { chooseModel(key); setModelOpen(false); }}>
                    <div>
                      <div>{spec.label}</div>
                      <div className="meta" style={{ marginLeft: 0, marginTop: 2 }}>{spec.sub}</div>
                    </div>
                    {key === model ? <I.Check style={{ width: 14, height: 14, marginLeft: 'auto' }} /> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="qb-group">
            {['1:1', '16:9', '9:16'].filter((value) => availableSizes.includes(value)).map((value) => (
              <button key={value} className={clsx('qb', value === ratio && 'active')} onClick={() => setRatio(value)}>
                <span className="v">{value}</span>
              </button>
            ))}
            <div className="qb" onClick={(e) => { e.stopPropagation(); setRatioOpen((v) => !v); setModelOpen(false); }}>
              <I.Ratio />
              <I.Chevron style={{ width: 11, height: 11, opacity: 0.5 }} />
              {ratioOpen ? (
                <div className="dropdown" style={{ left: 'auto', right: 0, minWidth: 180 }}>
                  <div className="dd-section">All ratios</div>
                  {modelSpec.sizes.map((size) => {
                    const disabled = !availableSizes.includes(size);
                    return (
                      <div
                        key={size}
                        className={clsx('dd-item', size === ratio && 'active', disabled && 'disabled')}
                        onClick={() => {
                          if (disabled) return;
                          setRatio(size);
                          setRatioOpen(false);
                        }}
                      >
                        <span>{size}</span>
                        {size === ratio ? <I.Check style={{ width: 14, height: 14, marginLeft: 'auto' }} /> : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {modelSpec.maxN > 1 ? (
            <div className="qb-group">
              {[1, 2, 3, 4].map((value) => (
                <button
                  key={value}
                  disabled={value > modelSpec.maxN}
                  className={clsx('qb', value === n && 'active', value > modelSpec.maxN && 'disabled')}
                  onClick={() => value <= modelSpec.maxN && setN(value)}
                >
                  <span className="v">x{value}</span>
                </button>
              ))}
            </div>
          ) : null}

          <button className="qb" onClick={() => setDrawerOpen(true)}>
            <I.Sliders />
            <span>Params</span>
          </button>

          <div className="qb-spacer" />
          <div className="qb-hint">
            <kbd>Shift</kbd>+<kbd>Enter</kbd> newline · <kbd>Enter</kbd> submit
          </div>
        </div>
      </div>
    </div>
  );
}

function NoKeyBanner({ onGo }: { onGo: () => void }) {
  return (
    <div className="no-key">
      <div className="ico"><I.Key style={{ width: 16, height: 16 }} /></div>
      <div className="body">
        <b>No API Key configured</b>
        <div>All generation features are disabled until you add an Apimart key in Settings. The key stays in this browser only.</div>
      </div>
      <button className="go" onClick={onGo}>Open Settings →</button>
    </div>
  );
}

function formatDiagTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function DiagnosticPanel() {
  const { diagnosticsEnabled, setDiagnosticsEnabled, diagnostics, clearDiagnostics } = useStore();
  const recent = diagnostics.slice(0, 8);

  return (
    <section className="diag-panel">
      <div className="diag-head">
        <div className="diag-title">
          <div className="diag-icon"><I.Info style={{ width: 14, height: 14 }} /></div>
          <div>
            <div className="name">Request Diagnostics</div>
            <div className="sub">Capture recent submit and poll events for debugging 401/403 and upstream instability.</div>
          </div>
        </div>
        <div className="diag-actions">
          <button className={clsx('diag-toggle', diagnosticsEnabled && 'active')} onClick={() => setDiagnosticsEnabled((v) => !v)}>
            {diagnosticsEnabled ? 'On' : 'Off'}
          </button>
          <button className="diag-clear" onClick={clearDiagnostics} disabled={diagnostics.length === 0}>Clear</button>
        </div>
      </div>

      {diagnosticsEnabled ? (
        recent.length > 0 ? (
          <div className="diag-list">
            {recent.map((entry: DiagnosticEntry) => (
              <div key={entry.id} className="diag-item">
                <div className="diag-row">
                  <span className="diag-time">{formatDiagTime(entry.at)}</span>
                  <span className={clsx('diag-badge', entry.state)}>{entry.phase}.{entry.state}</span>
                  {typeof entry.code === 'number' ? <span className="diag-code">HTTP {entry.code}</span> : null}
                  {entry.taskId ? <span className="diag-task">{entry.taskId}</span> : null}
                </div>
                <div className="diag-msg">{entry.message}</div>
                <div className="diag-meta">
                  {entry.model ? <span>{entry.model}</span> : null}
                  {entry.ratio ? <span>{entry.ratio}</span> : null}
                  {typeof entry.n === 'number' ? <span>x{entry.n}</span> : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="diag-empty">No events yet. Submit a request and the latest diagnostics will appear here.</div>
        )
      ) : (
        <div className="diag-empty">Diagnostics are off. Turn them on before reproducing an issue.</div>
      )}
    </section>
  );
}

function EmptyState({ onPick }: { onPick: (p: string) => void }) {
  return (
    <div className="empty">
      <div className="empty-mark">
        <div className="ring" /><div className="ring" /><div className="ring" />
        <div className="dot" />
      </div>
      <div>
        <h1>Start your <em>next render</em>.</h1>
        <div className="sub" style={{ marginTop: 12 }}>Describe the scene below, upload references, or start from a quick prompt.</div>
      </div>
      <div className="chips">
        {QUICK_PROMPTS.map((prompt) => (
          <button key={prompt} className="chip" onClick={() => onPick(prompt)}>{prompt}</button>
        ))}
      </div>
    </div>
  );
}

function ResultCard({ turn, onRetry, onReuse }: {
  turn: Turn;
  onRetry: (t: Turn) => void;
  onReuse: (t: Turn) => void;
}) {
  const { setLightbox } = useStore();
  const modelSpec = getModelSpec(turn.model);
  const ratioParts = turn.ratio.split(':').map(Number);
  const aspect = `${ratioParts[0]} / ${ratioParts[1]}`;
  const cols = turn.n === 1 ? 1 : 2;

  async function doDownload(url: string, index: number) {
    try {
      const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || 'png';
      await downloadImage(url, `${turn.taskId || turn.id}_${index + 1}.${ext.length <= 4 ? ext : 'png'}`);
    } catch (err) {
      alert(`Download failed: ${(err as Error).message}`);
    }
  }

  async function downloadAll() {
    if (!turn.resultUrls) return;
    for (let i = 0; i < turn.resultUrls.length; i++) {
      await doDownload(turn.resultUrls[i], i);
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
  }

  return (
    <div className="turn">
      <div className="turn-prompt">
        <div className="meta">
          <span>{modelSpec.label}</span>
          <span>{turn.ratio}</span>
          {turn.resolution ? <span>{turn.resolution}</span> : null}
          <span>x{turn.n}</span>
          <span style={{ marginLeft: 'auto' }}>{fmtTime(turn.createdAt)}</span>
        </div>
        {turn.prompt}
        {turn.refs?.length ? (
          <div className="refs">
            {turn.refs.map((ref) => (
              <div
                key={ref.id}
                className="ref"
                style={ref.dataUrl || ref.url
                  ? { backgroundImage: `url(${ref.dataUrl || ref.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: `repeating-linear-gradient(45deg, oklch(0.3 0.04 ${ref.hue}) 0 5px, oklch(0.38 0.05 ${ref.hue}) 5px 7px)` }}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="result-card">
        <div className="head">
          <span className={clsx('status', turn.status === 'completed' ? 'done' : turn.status === 'failed' ? 'fail' : 'pending')}>
            <span className="dot" />
            {turn.status === 'submitted' ? 'Submitted' : null}
            {turn.status === 'processing' ? 'Processing' : null}
            {turn.status === 'completed' ? 'Completed' : null}
            {turn.status === 'failed' ? 'Failed' : null}
          </span>
          <span>{turn.taskId || 'Waiting for task_id...'}</span>
          <span className="ts">{turn.status === 'completed' ? `${turn.duration}s` : turn.status === 'failed' ? '—' : '...'}</span>
        </div>

        <div className="res-grid" style={{ '--cols': cols, '--aspect': aspect } as CSSProperties}>
          {Array.from({ length: turn.n }).map((_, index) => {
            const hue = hueFor(turn.id, index);
            const url = turn.resultUrls?.[index];

            if (turn.status === 'completed' && url) {
              return (
                <div key={index} className="res-cell has-image" onClick={() => setLightbox({ turn, idx: index, hue })}>
                  <img
                    src={proxiedImage(url)}
                    alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span className="tag">{(turn.taskId || turn.id).slice(-4)}_{index + 1}</span>
                  <div className="res-actions" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setLightbox({ turn, idx: index, hue })}><I.Expand style={{ width: 12, height: 12 }} /> View</button>
                    <button onClick={() => doDownload(url, index)}><I.Download style={{ width: 12, height: 12 }} /> Download</button>
                    <button onClick={() => copyUrl(url)} title="Copy URL"><I.Copy style={{ width: 12, height: 12 }} /></button>
                  </div>
                </div>
              );
            }

            if (turn.status === 'failed') {
              return (
                <div key={index} className="res-cell" style={{ background: 'repeating-linear-gradient(45deg, var(--surface) 0 10px, var(--surface-2) 10px 11px)' }}>
                  <div className="spin">
                    <I.Alert style={{ width: 20, height: 20, color: 'var(--danger)' }} />
                    <span className="pct" style={{ color: 'var(--danger)' }}>Failed</span>
                  </div>
                </div>
              );
            }

            if (turn.status === 'completed') {
              return (
                <div key={index} className="res-cell" style={{ background: 'repeating-linear-gradient(45deg, var(--surface) 0 10px, var(--surface-2) 10px 11px)' }}>
                  <div className="spin">
                    <I.Image style={{ width: 20, height: 20, color: 'var(--fg-4)' }} />
                    <span className="pct" style={{ color: 'var(--fg-4)' }}>No result</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={index} className="res-cell loading">
                <div className="spin">
                  <div className="spinner" />
                  <span className="pct">{Math.round(turn.progress)}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {turn.status !== 'completed' && turn.status !== 'failed' ? (
          <div className="progress-bar"><div className="fill" style={{ width: `${turn.progress}%` }} /></div>
        ) : null}

        {turn.status === 'failed' ? (
          <div className="result-foot" style={{ color: 'var(--danger)' }}>
            <I.Alert style={{ width: 14, height: 14 }} />
            <span>{turn.error}</span>
            <div className="spacer" />
            <button className="fbtn" onClick={() => onRetry(turn)}><I.Refresh style={{ width: 12, height: 12 }} /> Retry</button>
          </div>
        ) : null}

        {turn.status === 'completed' ? (
          <div className="result-foot">
            <span>{turn.n} images · {turn.ratio}{turn.resolution ? ` · ${turn.resolution}` : ''}</span>
            <div className="spacer" />
            <button className="fbtn" onClick={() => onReuse(turn)}><I.Refresh style={{ width: 12, height: 12 }} /> Reuse prompt</button>
            <button className="fbtn primary" onClick={downloadAll}><I.Download style={{ width: 12, height: 12 }} /> Download all</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function Workspace() {
  const router = useRouter();
  const { hasKey, turns, model, ratio, n, adv, submitTurn, retryTurn, setModel, setRatio, setN } = useStore();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns.length]);

  function handleComposerSubmit({ prompt, refs, model: nextModel, ratio: nextRatio, n: nextN }: {
    prompt: string;
    refs: RefImage[];
    model: string;
    ratio: string;
    n: number;
  }) {
    submitTurn({ prompt, refs, model: nextModel, ratio: nextRatio, n: nextN, adv });
  }

  function reuse(turn: Turn) {
    setModel(turn.model);
    setRatio(turn.ratio);
    setN(turn.n);
    try {
      localStorage.setItem('draft_prompt', turn.prompt);
    } catch {}
    window.dispatchEvent(new Event('draft-reload'));
  }

  return (
    <div className="workspace">
      <div className="results" ref={scrollRef}>
        <div className="results-inner">
          {!hasKey ? <NoKeyBanner onGo={() => router.push('/settings')} /> : null}
          <DiagnosticPanel />
          {turns.length === 0 && hasKey ? (
            <EmptyState onPick={(prompt) => submitTurn({ prompt, refs: [], model, ratio, n, adv })} />
          ) : null}
          {turns.length === 0 && !hasKey ? <EmptyState onPick={() => router.push('/settings')} /> : null}
          {turns.map((turn) => (
            <ResultCard key={turn.id} turn={turn} onRetry={retryTurn} onReuse={reuse} />
          ))}
        </div>
      </div>
      <Composer hasKey={hasKey} onSubmit={handleComposerSubmit} />
    </div>
  );
}
