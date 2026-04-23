'use client';

import { createContext, useContext } from 'react';
import { SAMPLE_HISTORY } from './data';

export type Tweaks = {
  accent: number;
  floating: boolean;
  sidebar: 'icon' | 'full';
};

export type ApiConfig = {
  id: string;
  name: string;
  key: string;
  defaultModel: string;
  enabled: boolean;
  createdAt: number;
};

export type RefImage = {
  id: string;
  hue: number;
  name?: string;
  /** data URL for uploaded files (`data:image/png;base64,...`) */
  dataUrl?: string;
  /** public URL pasted by user */
  url?: string;
  size?: number;
};

export type Turn = {
  id: string;
  taskId: string;
  prompt: string;
  refs: RefImage[];
  model: string;
  ratio: string;
  resolution?: string;
  quality?: string;
  n: number;
  status: 'submitted' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: number;
  updatedAt?: number;
  duration?: number;
  error?: string;
  resultUrls?: string[];
  expiresAt?: number;
  /** snapshot of advanced params at submit time, used to retry */
  advSnapshot?: Adv;
};

export type HistoryItem = {
  id: string;
  taskId?: string;
  prompt: string;
  refs?: RefImage[];
  model: string;
  ratio: string;
  resolution?: string;
  n: number;
  status: 'completed' | 'failed';
  createdAt: number;
  duration?: number;
  error?: string;
  resultUrls?: string[];
  expiresAt?: number;
};

export type Adv = {
  resolution: string;
  quality: string;
  background: string;
  moderation: string;
  format: string;
  compression: number;
  fallback: boolean;
  maskUrl?: string;
};

export type DiagnosticEntry = {
  id: string;
  at: number;
  phase: 'submit' | 'poll';
  state: 'pending' | 'ok' | 'error';
  model?: string;
  ratio?: string;
  n?: number;
  taskId?: string;
  message: string;
  code?: number;
};

export type AppStore = {
  tweaks: Tweaks;
  setTweaks: (t: Tweaks) => void;
  tweaksOpen: boolean;
  setTweaksOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  configs: ApiConfig[];
  setConfigs: (c: ApiConfig[] | ((prev: ApiConfig[]) => ApiConfig[])) => void;
  hasKey: boolean;
  apiKey: string;
  model: string;
  setModel: (m: string) => void;
  ratio: string;
  setRatio: (r: string) => void;
  n: number;
  setN: (n: number) => void;
  adv: Adv;
  setAdv: (a: Adv) => void;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
  turns: Turn[];
  setTurns: (t: Turn[] | ((prev: Turn[]) => Turn[])) => void;
  historyList: HistoryItem[];
  setHistoryList: (h: HistoryItem[] | ((prev: HistoryItem[]) => HistoryItem[])) => void;
  diagnosticsEnabled: boolean;
  setDiagnosticsEnabled: (v: boolean | ((prev: boolean) => boolean)) => void;
  diagnostics: DiagnosticEntry[];
  clearDiagnostics: () => void;
  lightbox: { turn: Turn | HistoryItem; idx: number; hue: number } | null;
  setLightbox: (v: AppStore['lightbox']) => void;
  /** Submit a turn to the API and start polling. Called by Composer. */
  submitTurn: (payload: { prompt: string; refs: RefImage[]; model: string; ratio: string; n: number; adv: Adv }) => void;
  retryTurn: (turn: Turn) => void;
};

export const AppStoreContext = createContext<AppStore | null>(null);

export function useStore(): AppStore {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useStore must be used inside <AppShell>');
  return ctx;
}

export const DEFAULT_TWEAKS: Tweaks = { accent: 85, floating: false, sidebar: 'full' };
export const DEFAULT_ADV: Adv = {
  resolution: '1k', quality: 'auto', background: 'auto', moderation: 'auto',
  format: 'png', compression: 80, fallback: false,
};
export const DEFAULT_CONFIGS: ApiConfig[] = [];
export { SAMPLE_HISTORY };
