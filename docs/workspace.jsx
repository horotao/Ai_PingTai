// Workspace page (main creation surface)
const { useState, useRef, useEffect, useMemo, useCallback } = React;

function Composer({ hasKey, onSubmit, onOpenDrawer, model, setModel, ratio, setRatio, n, setN, floating }) {
  const [prompt, setPrompt] = useState('');
  const [refs, setRefs] = useState([]); // [{id, hue}]
  const [modelOpen, setModelOpen] = useState(false);
  const [ratioOpen, setRatioOpen] = useState(false);
  const [drag, setDrag] = useState(false);
  const taRef = useRef(null);

  // draft autosave
  useEffect(() => {
    try {
      const saved = localStorage.getItem('draft_prompt');
      if (saved) setPrompt(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('draft_prompt', prompt); } catch {}
  }, [prompt]);

  // auto-resize
  useEffect(() => {
    const t = taRef.current;
    if (!t) return;
    t.style.height = 'auto';
    t.style.height = Math.min(t.scrollHeight, 240) + 'px';
  }, [prompt]);

  // close popovers on outside click
  useEffect(() => {
    const h = (e) => {
      if (!e.target.closest?.('.qb')) { setModelOpen(false); setRatioOpen(false); }
    };
    window.addEventListener('click', h);
    return () => window.removeEventListener('click', h);
  }, []);

  const m = MODELS[model];
  const canSubmit = hasKey && prompt.trim().length > 0;

  function addRef() {
    if (refs.length >= 16) return;
    setRefs([...refs, { id: 'r-' + Math.random().toString(36).slice(2, 8), hue: Math.floor(Math.random() * 360) }]);
  }
  function removeRef(id) { setRefs(refs.filter(r => r.id !== id)); }

  function submit() {
    if (!canSubmit) return;
    onSubmit({ prompt: prompt.trim(), refs, model, ratio, n });
    setPrompt('');
    setRefs([]);
    try { localStorage.setItem('draft_prompt', ''); } catch {}
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className={clsx('composer-wrap')}>
      <div
        className={clsx('composer', floating && 'floating', drag && 'drag')}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); addRef(); }}
      >
        {refs.length > 0 && (
          <div className="composer-refs">
            {refs.map(r => (
              <div key={r.id} className="ref-thumb" style={{ background: `repeating-linear-gradient(45deg, oklch(0.3 0.04 ${r.hue}) 0 6px, oklch(0.38 0.05 ${r.hue}) 6px 8px)` }}>
                <button className="x" onClick={() => removeRef(r.id)}><I.X style={{ width: 10, height: 10 }} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="composer-row">
          <button className="icon-btn" onClick={addRef} disabled={!hasKey || refs.length >= 16} title="上传参考图">
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
          {/* model select */}
          <div className="qb" onClick={(e) => { e.stopPropagation(); setModelOpen(v => !v); setRatioOpen(false); }}>
            <I.Sparkles />
            <span className="v">{m.label}</span>
            <I.Chevron style={{ width: 11, height: 11, opacity: 0.5 }} />
            {modelOpen && (
              <div className="dropdown">
                <div className="dd-section">模型</div>
                {Object.entries(MODELS).map(([k, v]) => (
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

          {/* ratio quick */}
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
                  {m.sizes.map(s => (
                    <div key={s} className={clsx('dd-item', s === ratio && 'active')} onClick={() => { setRatio(s); setRatioOpen(false); }}>
                      <span>{s}</span>
                      {s === ratio && <I.Check style={{ width: 14, height: 14, marginLeft: 'auto' }} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* n */}
          {m.maxN > 1 && (
            <div className="qb-group">
              {[1,2,3,4].map(v => (
                <button key={v} className={clsx('qb', v === n && 'active')} onClick={() => setN(v)}>
                  <span className="v">×{v}</span>
                </button>
              ))}
            </div>
          )}

          {/* params */}
          <button className="qb" onClick={onOpenDrawer}>
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

function NoKeyBanner({ onGo }) {
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

function EmptyState({ onPick }) {
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

function ResultCard({ turn, onLightbox, onReuse, onUseAsRef, onRetry, onRemove }) {
  const m = MODELS[turn.model];
  const ratioParts = turn.ratio.split(':').map(Number);
  const aspect = `${ratioParts[0]} / ${ratioParts[1]}`;
  const cols = turn.n === 1 ? 1 : turn.n === 2 ? 2 : 2;
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
              <div key={r.id} className="ref" style={{ background: `repeating-linear-gradient(45deg, oklch(0.3 0.04 ${r.hue}) 0 5px, oklch(0.38 0.05 ${r.hue}) 5px 7px)` }} />
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
          <span>{turn.taskId}</span>
          <span className="ts">{turn.status === 'completed' ? `${turn.duration}s` : turn.status === 'failed' ? '—' : '...'}</span>
        </div>

        <div className="res-grid" style={{ '--cols': cols, '--aspect': aspect }}>
          {Array.from({ length: turn.n }).map((_, i) => {
            const hue = hueFor(turn.id, i);
            if (turn.status === 'completed') {
              return (
                <div key={i} className="res-cell done" style={{ '--hue': hue, '--angle': 30 + (i * 27) % 90 }}
                     onClick={() => onLightbox({ turn, idx: i, hue })}>
                  <span className="tag">{turn.id.slice(-4)}_{i+1}</span>
                  <div className="res-actions" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => onLightbox({ turn, idx: i, hue })}><I.Expand style={{ width: 12, height: 12 }} /> 查看</button>
                    <button><I.Download style={{ width: 12, height: 12 }} /> 下载</button>
                    <button><I.Copy style={{ width: 12, height: 12 }} /></button>
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
            <button className="fbtn" onClick={() => onUseAsRef(turn)}><I.Image style={{ width: 12, height: 12 }} /> 作为参考</button>
            <button className="fbtn" onClick={() => onReuse(turn)}><I.Refresh style={{ width: 12, height: 12 }} /> 再次创作</button>
            <button className="fbtn primary"><I.Download style={{ width: 12, height: 12 }} /> 全部下载</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Workspace({ hasKey, goSettings, turns, setTurns, composerFloating, onOpenDrawer, model, setModel, ratio, setRatio, n, setN, onLightbox }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    // scroll to bottom on new turn
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns.length]);

  // simulate async progression
  useEffect(() => {
    const int = setInterval(() => {
      setTurns(prev => prev.map(t => {
        if (t.status === 'completed' || t.status === 'failed') return t;
        let progress = t.progress + (t.status === 'submitted' ? 4 : 3 + Math.random() * 4);
        let status = t.status;
        if (progress > 8 && status === 'submitted') status = 'processing';
        if (progress >= 100) {
          progress = 100;
          // tiny random failure for demo variety: only if prompt has the trigger
          if (t.prompt.includes('__fail__')) {
            return { ...t, status: 'failed', progress: 100, error: 'moderation_blocked: 触发安全策略' };
          }
          return { ...t, status: 'completed', progress: 100, duration: Math.round((Date.now() - t.createdAt) / 1000) };
        }
        return { ...t, progress, status };
      }));
    }, 260);
    return () => clearInterval(int);
  }, [setTurns]);

  function submit({ prompt, refs, model: mdl, ratio: r, n: num }) {
    const id = 'task-' + Math.random().toString(36).slice(2, 8);
    const turn = {
      id,
      taskId: 'apm_' + Math.random().toString(36).slice(2, 14),
      prompt, refs,
      model: mdl,
      ratio: r,
      resolution: MODELS[mdl].resolutions ? '1k' : undefined,
      n: num,
      status: 'submitted',
      progress: 2,
      createdAt: Date.now(),
    };
    setTurns(prev => [...prev, turn]);
  }

  function onReuse(t) { /* would fill composer — for demo, noop */ }
  function onUseAsRef(t) { /* noop */ }
  function onRetry(t) {
    setTurns(prev => prev.map(x => x.id === t.id ? { ...x, status: 'submitted', progress: 2, error: undefined } : x));
  }

  return (
    <div className="workspace">
      <div className="results" ref={scrollRef}>
        <div className="results-inner">
          {!hasKey && <NoKeyBanner onGo={goSettings} />}
          {turns.length === 0 && <EmptyState onPick={(p) => submit({ prompt: p, refs: [], model, ratio, n })} />}
          {turns.map(t => (
            <ResultCard
              key={t.id}
              turn={t}
              onLightbox={onLightbox}
              onReuse={onReuse}
              onUseAsRef={onUseAsRef}
              onRetry={onRetry}
            />
          ))}
        </div>
      </div>
      <Composer
        hasKey={hasKey}
        floating={composerFloating && turns.length === 0}
        onSubmit={submit}
        onOpenDrawer={onOpenDrawer}
        model={model} setModel={setModel}
        ratio={ratio} setRatio={setRatio}
        n={n} setN={setN}
      />
    </div>
  );
}

Object.assign(window, { Workspace });
