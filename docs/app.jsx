// Lightbox for viewing a single result image
function Lightbox({ data, onClose }) {
  if (!data) return null;
  const { turn, idx, hue } = data;
  const [a, b] = turn.ratio.split(':').map(Number);
  return (
    <div className="lightbox-mask" onClick={onClose}>
      <div className="lightbox-inner" onClick={e => e.stopPropagation()} style={{}}>
        <div className="lightbox-img" style={{ '--hue': hue, '--angle': 30 + (idx * 27) % 90, '--aspect': `${a}/${b}` }}>
          <button className="lightbox-close" onClick={onClose}><I.X style={{ width: 16, height: 16 }} /></button>
        </div>
        <div className="lightbox-side">
          <div className="info">
            <h3>结果详情</h3>
            <div style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.6, marginBottom: 18, paddingBottom: 14, borderBottom: '1px dashed var(--border)' }}>
              {turn.prompt}
            </div>
            <div className="row"><span>model</span><span>{turn.model}</span></div>
            <div className="row"><span>ratio</span><span>{turn.ratio}</span></div>
            {turn.resolution && <div className="row"><span>resolution</span><span>{turn.resolution}</span></div>}
            <div className="row"><span>seed</span><span>{turn.id.slice(-8)}</span></div>
            <div className="row"><span>index</span><span>{idx + 1} / {turn.n}</span></div>
            {turn.duration && <div className="row"><span>duration</span><span>{turn.duration}s</span></div>}
            <div className="row"><span>created</span><span>{fmtTime(turn.createdAt)}</span></div>
          </div>
          <div className="actions">
            <button className="btn ghost"><I.Copy style={{ width: 13, height: 13 }} /> URL</button>
            <button className="btn primary"><I.Download style={{ width: 13, height: 13 }} /> 下载</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tweaks panel
function TweaksPanel({ open, setOpen, tweaks, setTweaks }) {
  const accents = [
    { h: 85, name: '陶土金' },
    { h: 25, name: '朱砂' },
    { h: 310, name: '紫罗兰' },
    { h: 200, name: '冰蓝' },
    { h: 150, name: '苔绿' },
  ];
  return (
    <React.Fragment>
      <button className="tweaks-fab" onClick={() => setOpen(v => !v)}>
        <span className="dot" />
        <span>Tweaks</span>
      </button>
      {open && (
        <div className="tweaks-panel">
          <div className="tp-header">
            <h4>Tweaks</h4>
            <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => setOpen(false)}><I.X style={{ width: 13, height: 13 }} /></button>
          </div>
          <div className="tp-row">
            <div className="lbl">强调色</div>
            <div className="swatches">
              {accents.map(a => (
                <div key={a.h}
                     className={clsx('swatch', a.h === tweaks.accent && 'active')}
                     onClick={() => setTweaks({ ...tweaks, accent: a.h })}
                     style={{ background: `oklch(0.80 0.13 ${a.h})` }}
                     title={a.name} />
              ))}
            </div>
          </div>
          <div className="tp-row">
            <div className="lbl">输入区</div>
            <div className="seg">
              <button className={clsx(!tweaks.floating && 'active')} onClick={() => setTweaks({ ...tweaks, floating: false })}>底部贴边</button>
              <button className={clsx(tweaks.floating && 'active')} onClick={() => setTweaks({ ...tweaks, floating: true })}>中心浮动</button>
            </div>
          </div>
          <div className="tp-row">
            <div className="lbl">边栏</div>
            <div className="seg">
              <button className={clsx(tweaks.sidebar === 'icon' && 'active')} onClick={() => setTweaks({ ...tweaks, sidebar: 'icon' })}>仅图标</button>
              <button className={clsx(tweaks.sidebar === 'full' && 'active')} onClick={() => setTweaks({ ...tweaks, sidebar: 'full' })}>图标 + 文字</button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

// Sidebar
function Sidebar({ route, setRoute, tweaks }) {
  const items = [
    { k: 'home', icon: <I.Home />, label: '创作工作台', tip: '工作台' },
    { k: 'history', icon: <I.Clock />, label: '历史记录', tip: '历史记录' },
    { k: 'settings', icon: <I.Settings />, label: '设置', tip: '设置' },
  ];
  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-logo" />
        <div className="sb-wordmark">atelier<em>.</em></div>
      </div>
      <div className="sb-section-label">NAVIGATE</div>
      {items.map(it => (
        <div key={it.k}
             className={clsx('sb-item', route === it.k && 'active')}
             data-tip={it.tip}
             onClick={() => setRoute(it.k)}>
          {it.icon}
          <span className="label">{it.label}</span>
        </div>
      ))}
      <div className="sb-footer">
        <div className="sb-hint">本地优先 · 数据不离开此浏览器</div>
      </div>
    </aside>
  );
}

// Topbar
function Topbar({ route }) {
  const crumbs = {
    home: '未命名对话',
    history: '历史记录',
    settings: 'API 配置',
  };
  return (
    <header className="topbar">
      <div className="tb-title">
        <span>atelier</span>
        <span className="sep">/</span>
        <span className="cur">{crumbs[route]}</span>
      </div>
      <div className="tb-spacer" />
      {route === 'home' && (
        <React.Fragment>
          <span className="pill live"><span className="dot" />会话已就绪</span>
          <div className="tb-search">
            <I.Search style={{ width: 12, height: 12 }} />
            <input placeholder="搜索当前会话..." />
            <kbd>⌘K</kbd>
          </div>
          <button className="tb-action" title="筛选"><I.Filter style={{ width: 15, height: 15 }} /></button>
        </React.Fragment>
      )}
    </header>
  );
}

// Root app
function App() {
  const [route, setRoute] = useState('home');
  const [tweaks, setTweaks] = useState({ accent: 85, floating: false, sidebar: 'full' });
  const [tweaksOpen, setTweaksOpen] = useState(false);

  // configs
  const [configs, setConfigs] = useState([
    { id: 'cfg-demo', name: 'Apimart', key: 'sk-apm-demo-key-1a2b3c4d5e6f7g8h9i0j', defaultModel: 'gpt-image-2', enabled: true, createdAt: Date.now() - 3600000 },
  ]);
  const hasKey = configs.some(c => c.enabled && c.key?.trim());

  // creation state
  const [model, setModel] = useState('gpt-image-2');
  const [ratio, setRatio] = useState('1:1');
  const [n, setN] = useState(1);
  const [adv, setAdv] = useState({
    resolution: '1k', quality: 'auto', background: 'auto', moderation: 'auto',
    format: 'png', compression: 80, fallback: false,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [turns, setTurns] = useState([]);
  const [historyList, setHistoryList] = useState(SAMPLE_HISTORY);
  const [lightbox, setLightbox] = useState(null);

  // apply accent color
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', `oklch(0.80 0.13 ${tweaks.accent})`);
    document.documentElement.style.setProperty('--accent-2', `oklch(0.85 0.10 ${tweaks.accent})`);
  }, [tweaks.accent]);

  // apply sidebar width
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', tweaks.sidebar === 'icon' ? '64px' : '212px');
  }, [tweaks.sidebar]);

  return (
    <div className="app" data-sb={tweaks.sidebar}>
      <Sidebar route={route} setRoute={setRoute} tweaks={tweaks} />
      <main className="main">
        <Topbar route={route} />
        {route === 'home' && (
          <Workspace
            hasKey={hasKey}
            goSettings={() => setRoute('settings')}
            turns={turns} setTurns={setTurns}
            composerFloating={tweaks.floating}
            onOpenDrawer={() => setDrawerOpen(true)}
            model={model} setModel={setModel}
            ratio={ratio} setRatio={setRatio}
            n={n} setN={setN}
            onLightbox={setLightbox}
          />
        )}
        {route === 'history' && (
          <History
            turns={turns}
            historyList={historyList} setHistoryList={setHistoryList}
            onLightbox={setLightbox}
          />
        )}
        {route === 'settings' && (
          <Settings configs={configs} setConfigs={setConfigs} />
        )}
      </main>
      <ParamsDrawer
        open={drawerOpen} onClose={() => setDrawerOpen(false)}
        model={model} setModel={setModel}
        ratio={ratio} setRatio={setRatio}
        n={n} setN={setN}
        adv={adv} setAdv={setAdv}
      />
      <Lightbox data={lightbox} onClose={() => setLightbox(null)} />
      <TweaksPanel open={tweaksOpen} setOpen={setTweaksOpen} tweaks={tweaks} setTweaks={setTweaks} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
