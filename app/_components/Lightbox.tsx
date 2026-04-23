'use client';

import { fmtTime } from '../_lib/data';
import { useStore } from '../_lib/store';
import { downloadImage, previewImage } from '../_lib/apimart';
import { I } from './Icons';

export function Lightbox() {
  const { lightbox, setLightbox } = useStore();
  if (!lightbox) return null;
  const { turn, idx, hue } = lightbox;
  const [a, b] = String(turn.ratio).split(':').map(Number);
  const onClose = () => setLightbox(null);
  const url = turn.resultUrls?.[idx];

  async function copy() {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
  }
  async function save() {
    if (!url) return;
    try {
      const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || 'png';
      await downloadImage(url, `${(turn as any).taskId || turn.id}_${idx + 1}.${ext.length <= 4 ? ext : 'png'}`);
    } catch (err) {
      alert(`下载失败：${(err as Error).message}`);
    }
  }

  return (
    <div className="lightbox-mask" onClick={onClose}>
      <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
        <div
          className={`lightbox-img${url ? ' has-image' : ''}`}
          style={{
            ['--hue' as any]: hue,
            ['--angle' as any]: 30 + (idx * 27) % 90,
            ['--aspect' as any]: `${a}/${b}`,
            backgroundImage: url ? `url(${previewImage(url)})` : undefined,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}
        >
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
            {(turn as any).taskId && <div className="row"><span>task_id</span><span style={{ fontSize: 11 }}>{(turn as any).taskId}</span></div>}
            <div className="row"><span>index</span><span>{idx + 1} / {turn.n}</span></div>
            {(turn as any).duration && <div className="row"><span>duration</span><span>{(turn as any).duration}s</span></div>}
            <div className="row"><span>created</span><span>{fmtTime(turn.createdAt)}</span></div>
            {(turn as any).expiresAt && (
              <div className="row"><span>expires</span><span style={{ fontSize: 11 }}>{new Date((turn as any).expiresAt * 1000).toLocaleString()}</span></div>
            )}
          </div>
          <div className="actions">
            <button className="btn ghost" onClick={copy} disabled={!url}><I.Copy style={{ width: 13, height: 13 }} /> URL</button>
            <button className="btn primary" onClick={save} disabled={!url}><I.Download style={{ width: 13, height: 13 }} /> 下载</button>
          </div>
        </div>
      </div>
    </div>
  );
}
