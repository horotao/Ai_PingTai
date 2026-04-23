'use client';

import { clsx } from '../_lib/data';
import { useStore } from '../_lib/store';
import { I } from './Icons';

const accents = [
  { h: 85,  name: '陶土金' },
  { h: 25,  name: '朱砂' },
  { h: 310, name: '紫罗兰' },
  { h: 200, name: '冰蓝' },
  { h: 150, name: '苔绿' },
];

export function TweaksPanel() {
  const { tweaks, setTweaks, tweaksOpen, setTweaksOpen } = useStore();
  return (
    <>
      <button className="tweaks-fab" onClick={() => setTweaksOpen(v => !v)}>
        <span className="dot" />
        <span>Tweaks</span>
      </button>
      {tweaksOpen && (
        <div className="tweaks-panel">
          <div className="tp-header">
            <h4>Tweaks</h4>
            <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => setTweaksOpen(false)}><I.X style={{ width: 13, height: 13 }} /></button>
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
    </>
  );
}
