// History page
function History({ turns, historyList, setHistoryList, onLightbox }) {
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');

  const all = useMemo(() => {
    // merge completed turns from session into history
    const sessionItems = turns.filter(t => t.status === 'completed' || t.status === 'failed').map(t => ({
      id: t.id, prompt: t.prompt, model: t.model, ratio: t.ratio, n: t.n,
      resolution: t.resolution, status: t.status, createdAt: t.createdAt, turn: t,
      error: t.error,
    }));
    return [...sessionItems, ...historyList].sort((a, b) => b.createdAt - a.createdAt);
  }, [turns, historyList]);

  const filtered = all.filter(h => {
    if (filter !== 'all' && h.status !== filter) return false;
    if (q && !h.prompt.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  function del(id) {
    setHistoryList(historyList.filter(h => h.id !== id));
  }

  function clearAll() {
    if (confirm('确定清空全部历史记录？此操作不可撤销。')) setHistoryList([]);
  }

  return (
    <div className="page">
      <div className="page-inner" style={{ maxWidth: 960 }}>
        <div className="page-header">
          <h1>历史 <em>记录</em></h1>
          <div className="sub">所有任务记录仅保存在当前浏览器中。建议及时下载所需图片 — Apimart 返回的图片 URL 通常有时效性。</div>
        </div>

        <div className="warn-banner">
          <I.Info className="ico" style={{ width: 16, height: 16 }} />
          <div>
            <b style={{ color: 'var(--fg)' }}>记录仅保存在本浏览器中。</b>
            <span style={{ color: 'var(--fg-3)', marginLeft: 8 }}>清除浏览器数据 / 切换浏览器 / 切换设备后记录将丢失。可在设置页导出 JSON 备份。</span>
          </div>
        </div>

        <div className="history-toolbar">
          <div className="tb-search" style={{ minWidth: 240, flex: 1, maxWidth: 320 }}>
            <I.Search style={{ width: 14, height: 14 }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="搜索提示词..." />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['all','全部'],['completed','已完成'],['failed','失败']].map(([k, l]) => (
              <button key={k} className={clsx('filter-pill', filter === k && 'active')} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
          <div className="spacer" />
          <span className="count">{filtered.length} / {all.length}</span>
          <button className="btn sm"><I.Download style={{ width: 12, height: 12 }} /> 导出</button>
          <button className="btn sm danger" onClick={clearAll}><I.Trash style={{ width: 12, height: 12 }} /></button>
        </div>

        {filtered.length === 0 ? (
          <div className="history-empty">
            <div className="mark"><I.Clock style={{ width: 26, height: 26 }} /></div>
            <div style={{ fontSize: 15, color: 'var(--fg-2)', marginBottom: 4 }}>暂无记录</div>
            <div style={{ fontSize: 12 }}>完成第一次创作后，记录会出现在这里。</div>
          </div>
        ) : (
          <div className="hist-list">
            {filtered.map(h => {
              const m = MODELS[h.model];
              return (
                <div className="hist-item" key={h.id}>
                  <div
                    className={clsx('hist-thumb', h.status === 'failed' && 'fail')}
                    style={{ '--hue': hueFor(h.id) }}
                    onClick={() => h.status === 'completed' && onLightbox({ turn: h.turn || h, idx: 0, hue: hueFor(h.id) })}
                  />
                  <div className="hist-body">
                    <div className="prompt">{h.prompt}</div>
                    <div className="meta">
                      <span><span className="k">MODEL</span> {m.label}</span>
                      <span><span className="k">RATIO</span> {h.ratio}</span>
                      {h.resolution && <span><span className="k">RES</span> {h.resolution}</span>}
                      <span><span className="k">N</span> ×{h.n}</span>
                      <span><span className="k">{h.status === 'failed' ? 'FAILED' : 'DONE'}</span> {fmtTime(h.createdAt)}</span>
                    </div>
                    {h.error && <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>⚠ {h.error}</div>}
                  </div>
                  <div className="hist-ops">
                    {h.status === 'completed' && <button title="下载"><I.Download style={{ width: 15, height: 15 }} /></button>}
                    <button title="再次创作"><I.Refresh style={{ width: 15, height: 15 }} /></button>
                    <button title="删除" onClick={() => del(h.id)}><I.Trash style={{ width: 15, height: 15 }} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { History });
