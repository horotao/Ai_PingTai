'use client';

import { useRef, useState } from 'react';
import { MODELS, clsx } from '../_lib/data';
import { useStore, type ApiConfig, type HistoryItem } from '../_lib/store';
import { testApiKey } from '../_lib/apimart';
import { I } from './Icons';

type EditForm = Partial<ApiConfig> & { id: string; name: string; key: string; defaultModel: string; enabled: boolean };

export function Settings() {
  const { configs, setConfigs, historyList, setHistoryList } = useStore();
  const [editing, setEditing] = useState<EditForm | null>(null);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [testState, setTestState] = useState<Record<string, { s: 'testing' | 'ok' | 'fail'; msg?: string }>>({});
  const importRef = useRef<HTMLInputElement | null>(null);

  function startNew() {
    setEditing({ id: 'new', name: 'Apimart', key: '', defaultModel: 'gpt-image-2', enabled: true });
  }
  function save(cfg: EditForm) {
    if (cfg.id === 'new') {
      const next: ApiConfig = {
        id: 'cfg-' + Math.random().toString(36).slice(2, 8),
        name: cfg.name, key: cfg.key, defaultModel: cfg.defaultModel, enabled: cfg.enabled,
        createdAt: Date.now(),
      };
      const others = next.enabled ? configs.map(c => ({ ...c, enabled: false })) : configs;
      setConfigs([...others, next]);
    } else {
      const others = cfg.enabled
        ? configs.map(c => c.id === cfg.id ? { ...c, ...cfg } as ApiConfig : { ...c, enabled: false })
        : configs.map(c => c.id === cfg.id ? { ...c, ...cfg } as ApiConfig : c);
      setConfigs(others);
    }
    setEditing(null);
  }
  function remove(id: string) { setConfigs(configs.filter(c => c.id !== id)); }
  function toggleEnabled(id: string) { setConfigs(configs.map(c => ({ ...c, enabled: c.id === id }))); }
  async function testConnection(id: string) {
    const cfg = configs.find(c => c.id === id);
    if (!cfg?.key?.trim()) {
      setTestState(prev => ({ ...prev, [id]: { s: 'fail', msg: '未填写 Key' } }));
      setTimeout(() => setTestState(prev => { const n = { ...prev }; delete n[id]; return n; }), 2400);
      return;
    }
    setTestState(prev => ({ ...prev, [id]: { s: 'testing' } }));
    const result = await testApiKey(cfg.key.trim());
    setTestState(prev => ({ ...prev, [id]: { s: result.ok ? 'ok' : 'fail', msg: result.message } }));
    setTimeout(() => setTestState(prev => { const n = { ...prev }; delete n[id]; return n; }), 3000);
  }

  function exportAll() {
    const payload = {
      version: 1,
      exportedAt: Date.now(),
      configs,
      history: historyList,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atelier-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importFile(file: File) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (Array.isArray(json?.configs)) setConfigs(json.configs as ApiConfig[]);
      if (Array.isArray(json?.history)) setHistoryList(json.history as HistoryItem[]);
      alert('导入完成');
    } catch (err) {
      alert(`导入失败：${(err as Error).message}`);
    }
  }

  function clearAll() {
    if (!confirm('确定清空全部配置与历史记录？此操作不可撤销。')) return;
    setConfigs([]);
    setHistoryList([]);
    try {
      localStorage.removeItem('atelier_turns');
      localStorage.removeItem('draft_prompt');
    } catch { /* ignore */ }
  }
  function maskKey(k: string) {
    if (!k) return '（未填写）';
    if (k.length < 10) return '•'.repeat(k.length);
    return k.slice(0, 6) + '•'.repeat(Math.max(0, k.length - 10)) + k.slice(-4);
  }

  return (
    <div className="page">
      <div className="page-inner">
        <div className="page-header">
          <h1>API <em>配置</em></h1>
          <div className="sub">管理你的 Apimart API Key。Key 仅保存在当前浏览器的 localStorage 中，不会上传到任何服务器。</div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Apimart 配置</h3>
            <span className="muted">{configs.length} 项</span>
            <div className="spacer" />
            <button className="btn sm" onClick={startNew}><I.Plus style={{ width: 12, height: 12 }} /> 新增</button>
          </div>

          {configs.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>
              <I.Key style={{ width: 32, height: 32, opacity: 0.3, marginBottom: 12 }} />
              <div>还没有任何 API 配置</div>
              <button className="btn" onClick={startNew} style={{ marginTop: 16 }}><I.Plus style={{ width: 13, height: 13 }} /> 添加第一个配置</button>
            </div>
          ) : configs.map(c => (
            <div className="config-row" key={c.id}>
              <div className="icon-pill"><I.Key style={{ width: 16, height: 16 }} /></div>
              <div className="info">
                <div className="name">
                  {c.name}
                  {c.enabled && <span className="tag">默认</span>}
                  {testState[c.id]?.s === 'testing' && <span className="tag" style={{ background: 'transparent', borderColor: 'var(--border-2)', color: 'var(--fg-3)' }}>测试中...</span>}
                  {testState[c.id]?.s === 'ok' && <span className="tag" title={testState[c.id]?.msg}>连接正常</span>}
                  {testState[c.id]?.s === 'fail' && <span className="tag" title={testState[c.id]?.msg} style={{ background: 'oklch(0.68 0.18 25 / 0.12)', borderColor: 'oklch(0.68 0.18 25 / 0.3)', color: 'var(--danger)' }}>连接失败</span>}
                </div>
                <div className="sub">
                  {reveal[c.id] ? c.key : maskKey(c.key)} · 默认 {c.defaultModel}
                </div>
              </div>
              <div className="ops">
                <button onClick={() => setReveal({ ...reveal, [c.id]: !reveal[c.id] })} title="显示/隐藏">
                  {reveal[c.id] ? <I.EyeOff style={{ width: 15, height: 15 }} /> : <I.Eye style={{ width: 15, height: 15 }} />}
                </button>
                <button onClick={() => testConnection(c.id)} title="测试连接"><I.Refresh style={{ width: 15, height: 15 }} /></button>
                <button onClick={() => !c.enabled && toggleEnabled(c.id)} title="设为默认" style={{ color: c.enabled ? 'var(--success)' : undefined }}>
                  <I.Check style={{ width: 15, height: 15 }} />
                </button>
                <button onClick={() => setEditing({ id: c.id, name: c.name, key: c.key, defaultModel: c.defaultModel, enabled: c.enabled })} title="编辑"><I.Edit style={{ width: 15, height: 15 }} /></button>
                <button className="danger" onClick={() => remove(c.id)} title="删除"><I.Trash style={{ width: 15, height: 15 }} /></button>
              </div>
            </div>
          ))}

          <div className="safety-note">
            <div className="ico"><I.Shield style={{ width: 14, height: 14 }} /></div>
            <div>
              <b>存储与安全</b>
              <ul>
                <li>Key 仅保存在当前浏览器的 localStorage，不上传到任何服务器。</li>
                <li>请勿在公共 / 他人设备上填写 Key。清除浏览器数据后 Key 将丢失。</li>
                <li>可选：启用&ldquo;本地加密密码&rdquo;后，Key 将通过 Web Crypto API 加密保存。</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>数据管理</h3>
            <div className="spacer" />
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>
              所有配置与历史记录仅保存在本浏览器内。通过导出 JSON 文件可在其他浏览器 / 设备上恢复。
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                ref={importRef}
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ''; }}
              />
              <button className="btn" onClick={exportAll}><I.Download style={{ width: 13, height: 13 }} /> 导出全部（JSON）</button>
              <button className="btn ghost" onClick={() => importRef.current?.click()}><I.Upload style={{ width: 13, height: 13 }} /> 从 JSON 导入</button>
              <button className="btn danger" onClick={clearAll}><I.Trash style={{ width: 13, height: 13 }} /> 清空全部数据</button>
            </div>
          </div>
        </div>
      </div>

      {editing && <EditConfigModal cfg={editing} onCancel={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function EditConfigModal({ cfg, onCancel, onSave }: { cfg: EditForm; onCancel: () => void; onSave: (f: EditForm) => void }) {
  const [form, setForm] = useState<EditForm>(cfg);
  const [showKey, setShowKey] = useState(false);
  return (
    <div className="modal-mask" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{cfg.id === 'new' ? '新增配置' : '编辑配置'}</h3>
          <div className="sub">填写你的 Apimart API Key。</div>
        </div>
        <div className="modal-body">
          <div className="form-field">
            <label>CONFIG_NAME</label>
            <input className="input-box" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-field">
            <label>API_KEY</label>
            <div className="key-input">
              <input type={showKey ? 'text' : 'password'} value={form.key}
                     onChange={e => setForm({ ...form, key: e.target.value })}
                     placeholder="sk-apm-..." />
              <div className="reveal">
                <button onClick={() => setShowKey(v => !v)}>{showKey ? <I.EyeOff style={{ width: 14, height: 14 }} /> : <I.Eye style={{ width: 14, height: 14 }} />}</button>
              </div>
            </div>
          </div>
          <div className="form-field">
            <label>DEFAULT_MODEL</label>
            <div className="grid-opts" style={{ ['--gcols' as any]: 2 }}>
              {Object.keys(MODELS).map(k => (
                <button key={k} className={clsx('opt', k === form.defaultModel && 'active')} onClick={() => setForm({ ...form, defaultModel: k })} style={{ padding: 10, textAlign: 'left' }}>
                  <div style={{ fontSize: 12, color: 'var(--fg)' }}>{k}</div>
                  <div style={{ fontSize: 10, color: 'var(--fg-4)', marginTop: 3 }}>{(MODELS as any)[k].sub}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
              <div className={clsx('switch', form.enabled && 'on')} onClick={() => setForm({ ...form, enabled: !form.enabled })} />
              <div>
                <div>设为默认启用</div>
                <div style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 2 }}>默认配置将用于所有创作请求。</div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn ghost" onClick={onCancel}>取消</button>
          <button className="btn primary" onClick={() => onSave(form)} disabled={!form.key.trim()}>保存</button>
        </div>
      </div>
    </div>
  );
}
