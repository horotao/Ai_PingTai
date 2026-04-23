'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MODELS, QUICK_PROMPTS, clsx, fmtTime, hueFor } from '../_lib/data';
import { useStore, type DiagnosticEntry, type RefImage, type Turn } from '../_lib/store';
import { downloadImage, proxiedImage, readFileAsDataURL } from '../_lib/apimart';
import { I } from './Icons';

function Composer({ hasKey, onSubmit }: { hasKey: boolean; onSubmit: (p: { prompt: string; refs: RefImage[]; model: string; ratio: string; n: number }) => void; }) {
  const { tweaks, model, setModel, ratio, setRatio, n, setN, setDrawerOpen, turns } = useStore();
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
    const load = () => { try { const saved = localStorage.getItem('draft_prompt'); if (saved) setPrompt(saved); } catch {} };
    load();
    window.addEventListener('draft-reload', load);
    return () => window.removeEventListener('draft-reload', load);
  }, []);
  useEffect(() => { try { localStorage.setItem('draft_prompt', prompt); } catch {} }, [prompt]);
  useEffect(() => {
    const t = taRef.current; if (!t) return;
    t.style.height = 'auto';
    t.style.height = Math.min(t.scrollHeight, 240) + 'px';
  }, [prompt]);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.('.qb')) { setModelOpen(false); setRatioOpen(false); }
    };
    window.addEventListener('click', h);
    return () => window.removeEventListener('click', h);
  }, []);

  const m = MODELS[model];
  const canSubmit = hasKey && prompt.trim().length > 0;

  async function addFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const next: RefImage[] = [...refs];
    setRefError('');
    for (const f of arr) {
      if (next.length >= 16) { setRefError('最多 16 张参考图'); break; }
      if (!f.type.startsWith('image/')) { setRefError(`${f.name} 不是图片`); continue; }
      if (f.size > 8 * 1024 * 1024) { setRefError(`${f.name} 超过 8MB`); continue; }
      try {
        const dataUrl = await readFileAsDataURL(f);
        next.push({
          id: 'r-' + Math.random().toString(36).slice(2, 10),
          hue: Math.floor(Math.random() * 360),
          name: f.name,
          size: f.size,
          dataUrl,
        });
      } catch {
        setRefError(`${f.name} 读取失败`);
      }
    }
    setRefs(next);
  }

  function removeRef(id: string) { setRefs(refs.filter(r => r.id !== id)); }

  function submit() {
    if (!canSubmit) return;
    onSubmit({ prompt: prompt.trim(), refs, model, ratio, n });
    setPrompt(''); setRefs([]); setRefError('');
    try { localStorage.setItem('draft_prompt', ''); } catch {}
  }
  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  return (
    <div className="composer-wrap">
      <div
        className={clsx('composer', floating && 'floating', drag && 'drag')}
        onDragOver={(e) => { e.preventDefault(); if (hasKey) setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (hasKey && e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
      >
        {refs.length > 0 && (
          <div className="composer-refs">
            {refs.map(r => (
              <div
                key={r.id}
                className="ref-thumb"
                title={r.name}
                style={r.dataUrl || r.url
                  ? { backgroundImage: `url(${r.dataUrl || r.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: `repeating-linear-gradient(45deg, oklch(0.3 0.04 ${r.hue}) 0 6px, oklch(0.38 0.05 ${r.hue}) 6px 8px)` }}
              >
                <button className="x" onClick={() => removeRef(r.id)}><I.X style={{ width: 10, height: 10 }} /></button>
              </div>
            ))}
          </div>
        )}
        {refError && <div style={{ fontSize: 11, color: 'var(--danger)', padding: '0 14px 4px' }}>{refError}</div>}
        <div className="composer-row">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
          />
          <button className="icon-btn" onClick={() => fileRef.current?.click()} disabled={!hasKey || refs.length >= 16} title="上传参考图">
            <I.Paperclip />
          </button>
          <textarea
            ref={taRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onKey}
            disabled={!hasKey}
            placeholder={hasKey ? '描述你想创造的画面... （Shift+Enter 换行）' : '请先在设置中填入 Apimart API Key'}
            rows={1}
          />
          <button className="send-btn" onClick={submit} disabled={!canSubmit} title="提交 (Enter)">
            <I.Send />
          </button>
        </div>
        <div className="quickbar">
          <div className="qb" onClick={(e) => { e.stopPropagation(); setModelOpen(v => !v); setRatioOpen(false); }}>
            <I.Sparkles />
            <span className="v">{m.label}</span>
            <I.Chevron style={{ width: 11, height: 11, opacity: 0.5 }} />
            {modelOpen && (
              <div className="dropdown">
                <div className="dd-section">模型</div>
                {Object.entries(MODELS).map(([k, v]: [string, any]) => (
                  <div key={k} className={clsx('dd-item', k === model && 'active')} onClick={() => { setModel(k); setModelOpen(false); }}>
                    <div>
                      <div>{v.label}</div>
                      <div className="meta" style={{ marginLeft: 0, marginTop: 2 }}>{v.sub}</div>
                    </div>
                    {k === model && <I.Check style={{ width: 14, height: 14, marginLeft: 'auto' }} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="qb-group">
            {['1:1','16:9','9:16'].map(r => (
              <button key={r} className={clsx('qb', r === ratio && 'active')} onClick={() => setRatio(r)}>
                <span className="v">{r}</span>
              </button>
            ))}
            <div className="qb" onClick={(e) => { e.stopPropagation(); setRatioOpen(v => !v); setModelOpen(false); }}>
              <I.Ratio />
              <I.Chevron style={{ width: 11, height: 11, opacity: 0.5 }} />
              {ratioOpen && (
                <div className="dropdown" style={{ left: 'auto', right: 0, minWidth: 180 }}>
                  <div className="dd-section">全部比例</div>
                  {m.sizes.map((s: string) => (
                    <div key={s} className={clsx('dd-item', s === ratio && 'active')} onClick={() => { setRatio(s); setRatioOpen(false); }}>
                      <span>{s}</span>
                      {s === ratio && <I.Check style={{ width: 14, height: 14, marginLeft: 'auto' }} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {m.maxN > 1 && (
            <div className="qb-group">
              {[1,2,3,4].map(v => (
                <button key={v} className={clsx('qb', v === n && 'active')} onClick={() => setN(v)}>
                  <span className="v">×{v}</span>
                </button>
              ))}
            </div>
          )}

          <button className="qb" onClick={() => setDrawerOpen(true)}>
            <I.Sliders />
            <span>参数</span>
          </button>

          <div className="qb-spacer" />
          <div className="qb-hint">
            <kbd>⇧</kbd>+<kbd>↵</kbd> 换行 · <kbd>↵</kbd> 提交
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
        <b>未配置 API Key</b>
        <div>所有创作功能已禁用。前往设置填入你的 Apimart Key 即可开始。Key 只保存在本浏览器。</div>
      </div>
      <button className="go" onClick={onGo}>前往设置 →</button>
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
                  {typeof entry.code === 'number' && <span className="diag-code">HTTP {entry.code}</span>}
                  {entry.taskId && <span className="diag-task">{entry.taskId}</span>}
                </div>
                <div className="diag-msg">{entry.message}</div>
                <div className="diag-meta">
                  {entry.model && <span>{entry.model}</span>}
                  {entry.ratio && <span>{entry.ratio}</span>}
                  {typeof entry.n === 'number' && <span>x{entry.n}</span>}
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
        <h1>开启你的 <em>新创作</em>.</h1>
        <div className="sub" style={{ marginTop: 12 }}>在下方描述你想要的画面，上传参考图，或从灵感词开始。</div>
      </div>
      <div className="chips">
        {QUICK_PROMPTS.map(p => (
          <button key={p} className="chip" onClick={() => onPick(p)}>{p}</button>
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
  const m = MODELS[turn.model];
  const ratioParts = turn.ratio.split(':').map(Number);
  const aspect = `${ratioParts[0]} / ${ratioParts[1]}`;
  const cols = turn.n === 1 ? 1 : 2;

  async function doDownload(url: string, index: number) {
    try {
      const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || 'png';
      await downloadImage(url, `${turn.taskId || turn.id}_${index + 1}.${ext.length <= 4 ? ext : 'png'}`);
    } catch (err) {
      alert(`下载失败：${(err as Error).message}`);
    }
  }
  async function downloadAll() {
    if (!turn.resultUrls) return;
    for (let i = 0; i < turn.resultUrls.length; i++) {
      await doDownload(turn.resultUrls[i], i);
    }
  }
  async function copyUrl(url: string) {
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
  }

  return (
    <div className="turn">
      <div className="turn-prompt">
        <div className="meta">
          <span>{m.label}</span>
          <span>{turn.ratio}</span>
          {turn.resolution && <span>{turn.resolution}</span>}
          <span>×{turn.n}</span>
          <span style={{ marginLeft: 'auto' }}>{fmtTime(turn.createdAt)}</span>
        </div>
        {turn.prompt}
        {turn.refs?.length > 0 && (
          <div className="refs">
            {turn.refs.map(r => (
              <div
                key={r.id}
                className="ref"
                style={r.dataUrl || r.url
                  ? { backgroundImage: `url(${r.dataUrl || r.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: `repeating-linear-gradient(45deg, oklch(0.3 0.04 ${r.hue}) 0 5px, oklch(0.38 0.05 ${r.hue}) 5px 7px)` }}
              />
            ))}
          </div>
        )}
      </div>
      <div className="result-card">
        <div className="head">
          <span className={clsx('status', turn.status === 'completed' ? 'done' : turn.status === 'failed' ? 'fail' : 'pending')}>
            <span className="dot" />
            {turn.status === 'submitted' && '已提交'}
            {turn.status === 'processing' && '处理中'}
            {turn.status === 'completed' && '已完成'}
            {turn.status === 'failed' && '已失败'}
          </span>
          <span>{turn.taskId || '等待 task_id...'}</span>
          <span className="ts">{turn.status === 'completed' ? `${turn.duration}s` : turn.status === 'failed' ? '—' : '...'}</span>
        </div>
        <div className="res-grid" style={{ ['--cols' as any]: cols, ['--aspect' as any]: aspect }}>
          {Array.from({ length: turn.n }).map((_, i) => {
            const hue = hueFor(turn.id, i);
            const url = turn.resultUrls?.[i];
            if (turn.status === 'completed' && url) {
              return (
                <div key={i} className="res-cell has-image"
                     onClick={() => setLightbox({ turn, idx: i, hue })}>
                  <img
                    src={proxiedImage(url)}
                    alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span className="tag">{(turn.taskId || turn.id).slice(-4)}_{i + 1}</span>
                  <div className="res-actions" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setLightbox({ turn, idx: i, hue })}><I.Expand style={{ width: 12, height: 12 }} /> 查看</button>
                    <button onClick={() => doDownload(url, i)}><I.Download style={{ width: 12, height: 12 }} /> 下载</button>
                    <button onClick={() => copyUrl(url)} title="复制 URL"><I.Copy style={{ width: 12, height: 12 }} /></button>
                  </div>
                </div>
              );
            }
            if (turn.status === 'failed') {
              return (
                <div key={i} className="res-cell" style={{ background: 'repeating-linear-gradient(45deg, var(--surface) 0 10px, var(--surface-2) 10px 11px)' }}>
                  <div className="spin">
                    <I.Alert style={{ width: 20, height: 20, color: 'var(--danger)' }} />
                    <span className="pct" style={{ color: 'var(--danger)' }}>失败</span>
                  </div>
                </div>
              );
            }
            if (turn.status === 'completed') {
              // Completed but this slot has no URL (rare: API returned fewer images than n).
              return (
                <div key={i} className="res-cell" style={{ background: 'repeating-linear-gradient(45deg, var(--surface) 0 10px, var(--surface-2) 10px 11px)' }}>
                  <div className="spin">
                    <I.Image style={{ width: 20, height: 20, color: 'var(--fg-4)' }} />
                    <span className="pct" style={{ color: 'var(--fg-4)' }}>无结果</span>
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className="res-cell loading">
                <div className="spin">
                  <div className="spinner" />
                  <span className="pct">{Math.round(turn.progress)}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {turn.status !== 'completed' && turn.status !== 'failed' && (
          <div className="progress-bar"><div className="fill" style={{ width: `${turn.progress}%` }} /></div>
        )}

        {turn.status === 'failed' && (
          <div className="result-foot" style={{ color: 'var(--danger)' }}>
            <I.Alert style={{ width: 14, height: 14 }} />
            <span>{turn.error}</span>
            <div className="spacer" />
            <button className="fbtn" onClick={() => onRetry(turn)}><I.Refresh style={{ width: 12, height: 12 }} /> 重试</button>
          </div>
        )}

        {turn.status === 'completed' && (
          <div className="result-foot">
            <span>{turn.n} 张 · {turn.ratio}{turn.resolution ? ` · ${turn.resolution}` : ''}</span>
            <div className="spacer" />
            <button className="fbtn" onClick={() => onReuse(turn)}><I.Refresh style={{ width: 12, height: 12 }} /> 再次创作</button>
            <button className="fbtn primary" onClick={downloadAll}><I.Download style={{ width: 12, height: 12 }} /> 全部下载</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Workspace() {
  const router = useRouter();
  const { hasKey, turns, model, ratio, n, adv, submitTurn, retryTurn, setModel, setRatio, setN } = useStore();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight;
  }, [turns.length]);

  function handleComposerSubmit({ prompt, refs, model: mdl, ratio: r, n: num }: {
    prompt: string; refs: RefImage[]; model: string; ratio: string; n: number;
  }) {
    submitTurn({ prompt, refs, model: mdl, ratio: r, n: num, adv });
  }

  function reuse(t: Turn) {
    // Restore model/ratio/n from the turn and populate the prompt draft.
    setModel(t.model);
    setRatio(t.ratio);
    setN(t.n);
    try { localStorage.setItem('draft_prompt', t.prompt); } catch {}
    // Trigger a synthetic storage event so composer reloads the draft.
    window.dispatchEvent(new Event('draft-reload'));
  }

  return (
    <div className="workspace">
      <div className="results" ref={scrollRef}>
        <div className="results-inner">
          {!hasKey && <NoKeyBanner onGo={() => router.push('/settings')} />}
          <DiagnosticPanel />
          {turns.length === 0 && hasKey && (
            <EmptyState onPick={(p) => submitTurn({ prompt: p, refs: [], model, ratio, n, adv })} />
          )}
          {turns.length === 0 && !hasKey && <EmptyState onPick={() => router.push('/settings')} />}
          {turns.map(t => (
            <ResultCard key={t.id} turn={t} onRetry={retryTurn} onReuse={reuse} />
          ))}
        </div>
      </div>
      <Composer hasKey={hasKey} onSubmit={handleComposerSubmit} />
    </div>
  );
}
