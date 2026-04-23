'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AppStoreContext,
  DEFAULT_ADV, DEFAULT_CONFIGS, DEFAULT_TWEAKS, SAMPLE_HISTORY,
  type ApiConfig, type Adv, type DiagnosticEntry, type HistoryItem, type RefImage, type Tweaks, type Turn,
} from '../_lib/store';
import {
  ApimartError,
  getTask,
  normalizeStatus,
  resultUrls as extractResultUrls,
  submitGeneration,
  type SubmitPayload,
} from '../_lib/apimart';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { TweaksPanel } from './TweaksPanel';
import { ParamsDrawer } from './ParamsDrawer';
import { Lightbox } from './Lightbox';

const LS = {
  tweaks: 'atelier_tweaks',
  configs: 'atelier_configs',
  history: 'atelier_history',
  turns: 'atelier_turns',
  diagnosticsEnabled: 'atelier_diagnostics_enabled',
  diagnostics: 'atelier_diagnostics',
};

function readLS<T>(k: string, fallback: T): T {
  try {
    const v = localStorage.getItem(k);
    if (!v) return fallback;
    return JSON.parse(v) as T;
  } catch { return fallback; }
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildPayload(turn: Turn): SubmitPayload {
  const refsRaw = turn.refs.map((r) => r.dataUrl || r.url).filter(Boolean) as string[];
  const payload: SubmitPayload = {
    model: turn.model,
    prompt: turn.prompt,
    size: turn.ratio,
    n: turn.n,
  };
  if (refsRaw.length) payload.image_urls = refsRaw;
  if (turn.model === 'gpt-image-2-official') {
    const a = turn.advSnapshot;
    if (a) {
      payload.resolution = a.resolution;
      if (a.quality && a.quality !== 'auto') payload.quality = a.quality;
      if (a.background && a.background !== 'auto') payload.background = a.background;
      if (a.moderation && a.moderation !== 'auto') payload.moderation = a.moderation;
      if (a.format && a.format !== 'png') payload.output_format = a.format;
      if ((a.format === 'jpeg' || a.format === 'webp') && typeof a.compression === 'number') {
        payload.output_compression = a.compression;
      }
      if (a.maskUrl && a.maskUrl.trim()) payload.mask_url = a.maskUrl.trim();
    }
  } else if (turn.model === 'gpt-image-2') {
    if (turn.advSnapshot?.fallback) payload.official_fallback = true;
  }
  return payload;
}

function toHistoryItem(turn: Turn): HistoryItem {
  return {
    id: turn.id,
    taskId: turn.taskId,
    prompt: turn.prompt,
    refs: turn.refs,
    model: turn.model,
    ratio: turn.ratio,
    resolution: turn.resolution,
    n: turn.n,
    status: turn.status === 'completed' ? 'completed' : 'failed',
    createdAt: turn.createdAt,
    duration: turn.duration,
    error: turn.error,
    resultUrls: turn.resultUrls,
    expiresAt: turn.expiresAt,
  };
}

/**
 * Should we poll this turn now? Matches PRD 搂9.3 + API docs:
 * - initial delay: 10s (official docs recommend 10-20s before first poll)
 * - then 3-4s for the first two minutes
 * - 6s for the next three minutes
 * - 10s afterwards (long-running 4K / high jobs)
 */
function shouldPoll(createdAt: number, lastPolledAt: number | undefined): boolean {
  const now = Date.now();
  const age = now - createdAt;
  if (age < 10_000) return false;
  if (lastPolledAt === undefined) return true;
  const sincePoll = now - lastPolledAt;
  if (age < 30_000) return sincePoll >= 3_000;
  if (age < 120_000) return sincePoll >= 4_000;
  if (age < 300_000) return sincePoll >= 6_000;
  return sincePoll >= 10_000;
}

/** Rough progress estimate from createdAt when API doesn't return progress. */
function estimateProgress(turn: Turn, apiProgress?: number): number {
  if (typeof apiProgress === 'number' && apiProgress > 0) return Math.min(99, apiProgress);
  const age = Date.now() - turn.createdAt;
  const expected = turn.model === 'gpt-image-2-official' && (turn.resolution === '2k' || turn.resolution === '4k')
    ? 120_000 : 60_000;
  const pct = Math.min(95, (age / expected) * 90 + 5);
  return Math.max(turn.progress, pct);
}

export function AppShell({ children }: { children: ReactNode }) {
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [configs, setConfigs] = useState<ApiConfig[]>(DEFAULT_CONFIGS);
  const [model, setModel] = useState('gpt-image-2');
  const [ratio, setRatio] = useState('1:1');
  const [n, setN] = useState(1);
  const [adv, setAdv] = useState<Adv>(DEFAULT_ADV);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [historyList, setHistoryList] = useState<HistoryItem[]>(SAMPLE_HISTORY as HistoryItem[]);
  const [diagnosticsEnabled, setDiagnosticsEnabled] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticEntry[]>([]);
  const [lightbox, setLightbox] = useState<{ turn: Turn | HistoryItem; idx: number; hue: number } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // hydrate from localStorage (client-only)
  useEffect(() => {
    setTweaks(readLS<Tweaks>(LS.tweaks, DEFAULT_TWEAKS));
    setConfigs(readLS<ApiConfig[]>(LS.configs, DEFAULT_CONFIGS));
    setHistoryList(readLS<HistoryItem[]>(LS.history, SAMPLE_HISTORY as HistoryItem[]));
    setTurns(readLS<Turn[]>(LS.turns, []));
    setDiagnosticsEnabled(readLS<boolean>(LS.diagnosticsEnabled, false));
    setDiagnostics(readLS<DiagnosticEntry[]>(LS.diagnostics, []));
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) try { localStorage.setItem(LS.tweaks, JSON.stringify(tweaks)); } catch {} }, [tweaks, hydrated]);
  useEffect(() => { if (hydrated) try { localStorage.setItem(LS.configs, JSON.stringify(configs)); } catch {} }, [configs, hydrated]);
  useEffect(() => { if (hydrated) try { localStorage.setItem(LS.history, JSON.stringify(historyList)); } catch {} }, [historyList, hydrated]);
  useEffect(() => { if (hydrated) try { localStorage.setItem(LS.turns, JSON.stringify(turns)); } catch {} }, [turns, hydrated]);
  useEffect(() => { if (hydrated) try { localStorage.setItem(LS.diagnosticsEnabled, JSON.stringify(diagnosticsEnabled)); } catch {} }, [diagnosticsEnabled, hydrated]);
  useEffect(() => { if (hydrated) try { localStorage.setItem(LS.diagnostics, JSON.stringify(diagnostics)); } catch {} }, [diagnostics, hydrated]);

  // accent color 鈫?CSS vars
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', `oklch(0.80 0.13 ${tweaks.accent})`);
    document.documentElement.style.setProperty('--accent-2', `oklch(0.85 0.10 ${tweaks.accent})`);
  }, [tweaks.accent]);

  // sidebar width
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', tweaks.sidebar === 'icon' ? '64px' : '212px');
  }, [tweaks.sidebar]);

  const activeConfig = configs.find((c) => c.enabled && c.key?.trim());
  const hasKey = Boolean(activeConfig);
  const apiKey = activeConfig?.key ?? '';

  // --- Polling engine ----------------------------------------------------
  const inflightRef = useRef<Set<string>>(new Set());
  const lastPollRef = useRef<Map<string, number>>(new Map());
  const turnsRef = useRef<Turn[]>(turns);
  turnsRef.current = turns;
  const apiKeyRef = useRef(apiKey);
  apiKeyRef.current = apiKey;
  const diagnosticsEnabledRef = useRef(diagnosticsEnabled);
  diagnosticsEnabledRef.current = diagnosticsEnabled;

  const pushDiagnostic = useCallback((entry: Omit<DiagnosticEntry, 'id' | 'at'>) => {
    if (!diagnosticsEnabledRef.current) return;
    setDiagnostics((prev) => [
      {
        id: `diag-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        at: Date.now(),
        ...entry,
      },
      ...prev,
    ].slice(0, 40));
  }, []);

  const clearDiagnostics = useCallback(() => {
    setDiagnostics([]);
  }, []);

  const applyTaskUpdate = useCallback((turnId: string, patch: Partial<Turn>, finalize?: 'complete' | 'fail') => {
    setTurns((prev) => {
      const t = prev.find((x) => x.id === turnId);
      if (!t) return prev;
      const merged: Turn = { ...t, ...patch, updatedAt: Date.now() };
      if (finalize === 'complete') {
        merged.status = 'completed';
        merged.progress = 100;
        merged.duration = Math.round((Date.now() - t.createdAt) / 1000);
        // push to history
        setHistoryList((h) => {
          const existing = h.findIndex((x) => x.id === merged.id);
          const item = toHistoryItem(merged);
          if (existing >= 0) { const copy = [...h]; copy[existing] = item; return copy; }
          return [item, ...h];
        });
      } else if (finalize === 'fail') {
        merged.status = 'failed';
        setHistoryList((h) => {
          const existing = h.findIndex((x) => x.id === merged.id);
          const item = toHistoryItem(merged);
          if (existing >= 0) { const copy = [...h]; copy[existing] = item; return copy; }
          return [item, ...h];
        });
      }
      return prev.map((x) => (x.id === turnId ? merged : x));
    });
  }, []);

  const pollOnce = useCallback(async (turn: Turn) => {
    const key = apiKeyRef.current;
    if (!key || !turn.taskId) return;
    try {
      const data = await getTask(key, turn.taskId);
      const norm = normalizeStatus(data.status);
      if (norm === 'completed') {
        const urls = extractResultUrls(data);
        pushDiagnostic({
          phase: 'poll',
          state: 'ok',
          model: turn.model,
          ratio: turn.ratio,
          n: turn.n,
          taskId: turn.taskId,
          message: `completed with ${urls.length}/${turn.n} image${urls.length === 1 ? '' : 's'}`,
        });
        applyTaskUpdate(turn.id, {
          resultUrls: urls,
          expiresAt: data.result?.images?.[0]?.expires_at,
          progress: 100,
        }, 'complete');
      } else if (norm === 'failed') {
        pushDiagnostic({
          phase: 'poll',
          state: 'error',
          model: turn.model,
          ratio: turn.ratio,
          n: turn.n,
          taskId: turn.taskId,
          code: data.error?.code,
          message: data.error?.message ?? 'task failed',
        });
        applyTaskUpdate(turn.id, {
          error: data.error?.message ?? '浠诲姟澶辫触',
        }, 'fail');
      } else {
        const progress = estimateProgress(turn, data.progress);
        applyTaskUpdate(turn.id, { status: norm, progress });
      }
    } catch (err) {
      if (err instanceof ApimartError && (err.code === 401 || err.code === 403)) {
        pushDiagnostic({
          phase: 'poll',
          state: 'error',
          model: turn.model,
          ratio: turn.ratio,
          n: turn.n,
          taskId: turn.taskId,
          code: err.code,
          message: err.message,
        });
        applyTaskUpdate(turn.id, { error: err.message }, 'fail');
      }
      // Otherwise keep polling (could be transient network issue)
    }
  }, [applyTaskUpdate, pushDiagnostic]);

  // Master polling scheduler: ticks every 1.5s, evaluates every non-terminal
  // turn against its per-turn backoff schedule. Single interval survives all
  // state changes 鈥?no re-render / ref / closure hazards.
  useEffect(() => {
    if (!hydrated) return;
    const inflight = inflightRef.current;
    const lastPoll = lastPollRef.current;

    const tick = () => {
      for (const turn of turnsRef.current) {
        if (turn.status === 'completed' || turn.status === 'failed') {
          lastPoll.delete(turn.id);
          continue;
        }
        if (!turn.taskId) continue;          // submit still in-flight
        if (inflight.has(turn.id)) continue;
        if (!shouldPoll(turn.createdAt, lastPoll.get(turn.id))) continue;

        inflight.add(turn.id);
        lastPoll.set(turn.id, Date.now());
        pollOnce(turn).finally(() => inflight.delete(turn.id));
      }
    };

    const id = window.setInterval(tick, 1500);
    tick();
    return () => window.clearInterval(id);
  }, [hydrated, pollOnce]);

  // One-shot recovery after hydrate: turns persisted as `completed` but with
  // fewer URLs than `n` (pre-fix bug) are re-fetched once so their full URL
  // list is populated.
  const recoveredRef = useRef(false);
  useEffect(() => {
    if (!hydrated || recoveredRef.current) return;
    if (!apiKey) return;
    recoveredRef.current = true;
    for (const turn of turnsRef.current) {
      if (turn.status !== 'completed') continue;
      if (!turn.taskId) continue;
      const have = turn.resultUrls?.length ?? 0;
      if (have >= turn.n) continue;
      (async () => {
        try {
          const data = await getTask(apiKey, turn.taskId);
          const urls = extractResultUrls(data);
          if (urls.length > have) {
            applyTaskUpdate(turn.id, { resultUrls: urls });
          }
        } catch { /* ignore 鈥?URL may have expired */ }
      })();
    }
  }, [hydrated, apiKey, applyTaskUpdate]);

  // --- Submit / retry ----------------------------------------------------
  const submitTurn = useCallback(async ({ prompt, refs, model: mdl, ratio: r, n: num, adv: advSnap }: {
    prompt: string; refs: RefImage[]; model: string; ratio: string; n: number; adv: Adv;
  }) => {
    if (!apiKey) return;
    const turnId = genId('turn');
    const pending: Turn = {
      id: turnId,
      taskId: '',
      prompt,
      refs,
      model: mdl,
      ratio: r,
      resolution: mdl === 'gpt-image-2-official' ? advSnap.resolution : undefined,
      quality: mdl === 'gpt-image-2-official' ? advSnap.quality : undefined,
      n: num,
      status: 'submitted',
      progress: 2,
      createdAt: Date.now(),
      advSnapshot: advSnap,
    };
    setTurns((prev) => [...prev, pending]);
    pushDiagnostic({
      phase: 'submit',
      state: 'pending',
      model: mdl,
      ratio: r,
      n: num,
      message: `submitting ${mdl} ${r} x${num}`,
    });

    try {
      const taskId = await submitGeneration(apiKey, buildPayload(pending));
      pushDiagnostic({
        phase: 'submit',
        state: 'ok',
        model: mdl,
        ratio: r,
        n: num,
        taskId,
        message: 'accepted by upstream and task_id received',
      });
      setTurns((prev) => prev.map((t) => (t.id === turnId ? { ...t, taskId, progress: 5 } : t)));
    } catch (err) {
      const msg = err instanceof ApimartError ? err.message : (err as Error)?.message || '鎻愪氦澶辫触';
      pushDiagnostic({
        phase: 'submit',
        state: 'error',
        model: mdl,
        ratio: r,
        n: num,
        code: err instanceof ApimartError ? err.code : undefined,
        message: msg,
      });
      applyTaskUpdate(turnId, { error: msg }, 'fail');
    }
  }, [apiKey, applyTaskUpdate, pushDiagnostic]);

  const retryTurn = useCallback(async (turn: Turn) => {
    if (!apiKey) return;
    setTurns((prev) => prev.map((t) => (t.id === turn.id ? { ...t, status: 'submitted', progress: 2, error: undefined, taskId: '', resultUrls: undefined, createdAt: Date.now() } : t)));
    pushDiagnostic({
      phase: 'submit',
      state: 'pending',
      model: turn.model,
      ratio: turn.ratio,
      n: turn.n,
      message: `retrying ${turn.model} ${turn.ratio} x${turn.n}`,
    });
    try {
      const taskId = await submitGeneration(apiKey, buildPayload({ ...turn, createdAt: Date.now() }));
      pushDiagnostic({
        phase: 'submit',
        state: 'ok',
        model: turn.model,
        ratio: turn.ratio,
        n: turn.n,
        taskId,
        message: 'retry accepted by upstream and task_id received',
      });
      setTurns((prev) => prev.map((t) => (t.id === turn.id ? { ...t, taskId, progress: 5 } : t)));
    } catch (err) {
      const msg = err instanceof ApimartError ? err.message : (err as Error)?.message || '鎻愪氦澶辫触';
      pushDiagnostic({
        phase: 'submit',
        state: 'error',
        model: turn.model,
        ratio: turn.ratio,
        n: turn.n,
        code: err instanceof ApimartError ? err.code : undefined,
        message: msg,
      });
      applyTaskUpdate(turn.id, { error: msg }, 'fail');
    }
  }, [apiKey, applyTaskUpdate, pushDiagnostic]);

  const store = {
    tweaks, setTweaks,
    tweaksOpen, setTweaksOpen,
    configs, setConfigs,
    hasKey,
    apiKey,
    model, setModel,
    ratio, setRatio,
    n, setN,
    adv, setAdv,
    drawerOpen, setDrawerOpen,
    turns, setTurns,
    historyList, setHistoryList,
    diagnosticsEnabled, setDiagnosticsEnabled,
    diagnostics, clearDiagnostics,
    lightbox, setLightbox,
    submitTurn,
    retryTurn,
  };

  return (
    <AppStoreContext.Provider value={store}>
      <div className="app" data-sb={tweaks.sidebar}>
        <Sidebar />
        <main className="main">
          <Topbar />
          {children}
        </main>
        <ParamsDrawer />
        <Lightbox />
        <TweaksPanel />
      </div>
    </AppStoreContext.Provider>
  );
}
