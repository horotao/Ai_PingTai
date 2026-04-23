'use client';

import { MODELS, clsx } from '../_lib/data';
import { useStore } from '../_lib/store';
import { I } from './Icons';

export function ParamsDrawer() {
  const { drawerOpen, setDrawerOpen, model, setModel, ratio, setRatio, n, setN, adv, setAdv } = useStore();
  if (!drawerOpen) return null;
  const m = MODELS[model];
  const is4k = adv.resolution === '4k';
  const availableSizes: string[] = is4k && m.sizes4k ? m.sizes4k : m.sizes;
  const onClose = () => setDrawerOpen(false);
  const patch = (kv: Partial<typeof adv>) => {
    const next = { ...adv, ...kv };
    setAdv(next);
    // If switching to 4k and current ratio not supported, auto-fallback.
    if (kv.resolution === '4k' && m.sizes4k && !m.sizes4k.includes(ratio)) {
      setRatio(m.sizes4k[0]);
    }
  };

  return (
    <>
      <div className="drawer-mask" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div>
            <h2>参数</h2>
            <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
              {m.label} · {m.sub}
            </div>
          </div>
          <button className="close" onClick={onClose}><I.X /></button>
        </div>
        <div className="drawer-body">
          <div className="field">
            <div className="label"><span className="name">model</span><span className="hint">必填</span></div>
            <div className="select">
              <div className="select-trigger">
                <div className="cur">{m.label}<span className="n">{m.features.join(' · ')}</span></div>
                <I.Chevron style={{ width: 14, height: 14, color: 'var(--fg-3)' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
              {Object.entries(MODELS).map(([k, v]: [string, any]) => (
                <button key={k} className={clsx('opt', k === model && 'active')} onClick={() => setModel(k)} style={{ textAlign: 'left', padding: 10 }}>
                  <div style={{ fontSize: 12, color: 'var(--fg)', marginBottom: 3 }}>{v.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--fg-4)' }}>{v.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <div className="label"><span className="name">size</span><span className="hint">{availableSizes.length} / {m.sizes.length} 可用</span></div>
            <div className="grid-opts" style={{ ['--gcols' as any]: 5 }}>
              {m.sizes.map((s: string) => {
                const disabled = !availableSizes.includes(s);
                const [a, b] = s.split(':').map(Number);
                const base = 22;
                const w = a >= b ? base : Math.round(base * a / b);
                const h = b >= a ? base : Math.round(base * b / a);
                return (
                  <button key={s} className={clsx('opt', s === ratio && 'active', disabled && 'disabled')} disabled={disabled} onClick={() => !disabled && setRatio(s)}>
                    <span className="shape" style={{ width: w, height: h }} />
                    {s}
                  </button>
                );
              })}
            </div>
            {is4k && <div className="desc">4K 分辨率下仅支持部分比例。</div>}
          </div>

          <div className="field">
            <div className="label"><span className="name">n</span><span className="hint">{m.maxN === 1 ? '固定 1' : '1 - 4'}</span></div>
            <div className="grid-opts" style={{ ['--gcols' as any]: 4 }}>
              {[1,2,3,4].map(v => (
                <button key={v} disabled={v > m.maxN} className={clsx('opt', v === n && 'active', v > m.maxN && 'disabled')} onClick={() => v <= m.maxN && setN(v)}>
                  ×{v}
                </button>
              ))}
            </div>
          </div>

          {model === 'gpt-image-2-official' && (
            <>
              <div className="field">
                <div className="label"><span className="name">resolution</span><span className="hint">4K 更慢</span></div>
                <div className="grid-opts" style={{ ['--gcols' as any]: 3 }}>
                  {m.resolutions.map((r: string) => (
                    <button key={r} className={clsx('opt', r === adv.resolution && 'active')} onClick={() => patch({ resolution: r })}>
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <div className="label"><span className="name">quality</span></div>
                <div className="grid-opts" style={{ ['--gcols' as any]: 4 }}>
                  {m.qualities.map((q: string) => (
                    <button key={q} className={clsx('opt', q === adv.quality && 'active')} onClick={() => patch({ quality: q })}>{q}</button>
                  ))}
                </div>
              </div>

              <div className="field">
                <div className="label"><span className="name">background</span></div>
                <div className="grid-opts" style={{ ['--gcols' as any]: 2 }}>
                  {m.backgrounds.map((b: string) => (
                    <button key={b} className={clsx('opt', b === adv.background && 'active')} onClick={() => patch({ background: b })}>{b}</button>
                  ))}
                </div>
              </div>

              <div className="field">
                <div className="label"><span className="name">moderation</span></div>
                <div className="grid-opts" style={{ ['--gcols' as any]: 2 }}>
                  {m.moderations.map((b: string) => (
                    <button key={b} className={clsx('opt', b === adv.moderation && 'active')} onClick={() => patch({ moderation: b })}>{b}</button>
                  ))}
                </div>
              </div>

              <div className="field">
                <div className="label"><span className="name">output_format</span></div>
                <div className="grid-opts" style={{ ['--gcols' as any]: 3 }}>
                  {m.formats.map((f: string) => (
                    <button key={f} className={clsx('opt', f === adv.format && 'active')} onClick={() => patch({ format: f })}>{f}</button>
                  ))}
                </div>
              </div>

              {adv.format !== 'png' && (
                <div className="field">
                  <div className="label"><span className="name">output_compression</span><span className="hint">{adv.compression}</span></div>
                  <div className="slider-row">
                    <input type="range" min={0} max={100} value={adv.compression} onChange={e => patch({ compression: +e.target.value })} />
                    <span className="val">{adv.compression}</span>
                  </div>
                </div>
              )}

              <div className="field">
                <div className="label" style={{ marginBottom: 0 }}>
                  <span className="name">mask_url <span style={{ color: 'var(--fg-4)', fontWeight: 400 }}>（局部重绘）</span></span>
                </div>
                <input
                  className="input-box"
                  placeholder="https://..."
                  style={{ marginTop: 8 }}
                  value={adv.maskUrl ?? ''}
                  onChange={(e) => patch({ maskUrl: e.target.value })}
                />
                <div className="desc">需要至少一张参考图，仅对该区域重新生成。Alpha 通道必须为「是」，尺寸需与首张参考图一致。</div>
              </div>
            </>
          )}

          {model === 'gpt-image-2' && (
            <div className="field">
              <div className="label" style={{ alignItems: 'center' }}>
                <span className="name">official_fallback</span>
                <div className={clsx('switch', adv.fallback && 'on')} onClick={() => patch({ fallback: !adv.fallback })} />
              </div>
              <div className="desc">当 gpt-image-2 不可用时，自动切换到官方渠道。</div>
            </div>
          )}

          <div className="field">
            <div className="label"><span className="name">image_urls</span><span className="hint">≤ 16 张</span></div>
            <div className="desc">通过底部输入区的 📎 按钮上传参考图。支持拖拽进入窗口。当前 0 / 16。</div>
          </div>
        </div>
      </div>
    </>
  );
}
