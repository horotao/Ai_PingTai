export type ApimartErrorBody = {
  error?: { code?: number; message?: string; type?: string };
};

export type SubmitOk = {
  code: number;
  data: Array<{ status: string; task_id: string }>;
};

export type TaskStatus =
  | 'submitted'
  | 'pending'
  | 'processing'
  | 'in_progress'
  | 'completed'
  | 'failed';

export type TaskData = {
  id: string;
  status: TaskStatus;
  progress?: number;
  created?: number;
  completed?: number;
  actual_time?: number;
  estimated_time?: number;
  result?: {
    images: Array<{ url: string[]; expires_at?: number }>;
  };
  error?: { message?: string; type?: string; code?: number };
};

export type TaskResponse = {
  code: number;
  data: TaskData;
};

export type SubmitPayload = {
  model: string;
  prompt: string;
  size?: string;
  n?: number;
  resolution?: string;
  quality?: string;
  background?: string;
  moderation?: string;
  output_format?: string;
  output_compression?: number;
  image_urls?: string[];
  mask_url?: string;
  official_fallback?: boolean;
};

export class ApimartError extends Error {
  code: number;
  type: string;
  constructor(message: string, code = 0, type = 'unknown_error') {
    super(message);
    this.code = code;
    this.type = type;
  }
}

async function parseError(res: Response): Promise<ApimartError> {
  let msg = `HTTP ${res.status}`;
  let code = res.status;
  let type = 'http_error';
  try {
    const body = (await res.json()) as ApimartErrorBody;
    if (body?.error?.message) msg = body.error.message;
    if (body?.error?.code) code = body.error.code;
    if (body?.error?.type) type = body.error.type;
  } catch {
    /* ignore parse errors */
  }
  return new ApimartError(msg, code, type);
}

export async function submitGeneration(apiKey: string, payload: SubmitPayload): Promise<string> {
  const res = await fetch('/api/apimart/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseError(res);
  const json = (await res.json()) as SubmitOk;
  const taskId = json?.data?.[0]?.task_id;
  if (!taskId) throw new ApimartError('响应缺少 task_id', 500, 'server_error');
  return taskId;
}

export async function getTask(apiKey: string, taskId: string): Promise<TaskData> {
  const res = await fetch(`/api/apimart/tasks/${encodeURIComponent(taskId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'no-store',
  });
  if (!res.ok) throw await parseError(res);
  const json = (await res.json()) as TaskResponse;
  if (!json?.data) throw new ApimartError('响应缺少 data 字段', 500, 'server_error');
  return json.data;
}

/**
 * Test API key by requesting a deliberately invalid task id.
 * - 401 → key invalid
 * - 404 / task_not_found → key valid (expected)
 * - other errors → surface as-is
 */
export async function testApiKey(apiKey: string): Promise<{ ok: boolean; message: string }> {
  try {
    await getTask(apiKey, 'task_connection_probe_00000000000000');
    return { ok: true, message: '连接正常' };
  } catch (err) {
    if (err instanceof ApimartError) {
      if (err.code === 401 || err.type === 'authentication_error') {
        return { ok: false, message: err.message || 'API Key 无效' };
      }
      if (err.code === 402) return { ok: false, message: err.message || '账户余额不足' };
      if (err.code === 403) return { ok: false, message: err.message || '访问被禁止' };
      // 404 / "任务不存在" / any message about task not found means key works
      return { ok: true, message: '连接正常' };
    }
    return { ok: false, message: (err as Error)?.message || '网络错误' };
  }
}

export function firstResultUrl(data: TaskData, idx = 0): string | undefined {
  const img = data.result?.images?.[idx];
  if (!img) return undefined;
  return Array.isArray(img.url) ? img.url[0] : (img.url as unknown as string);
}

export function resultUrls(data: TaskData): string[] {
  const out: string[] = [];
  for (const im of data.result?.images ?? []) {
    if (Array.isArray(im.url)) {
      for (const u of im.url) if (u) out.push(u);
    } else if (im.url) {
      out.push(im.url as unknown as string);
    }
  }
  return out;
}

export function proxiedImage(url: string): string {
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

export async function downloadImage(url: string, filename: string): Promise<void> {
  const res = await fetch(proxiedImage(url));
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error ?? new Error('read error'));
    r.readAsDataURL(file);
  });
}

export function isTerminal(status: string): boolean {
  return status === 'completed' || status === 'failed';
}

export function normalizeStatus(s: string): 'submitted' | 'processing' | 'completed' | 'failed' {
  if (s === 'completed') return 'completed';
  if (s === 'failed') return 'failed';
  if (s === 'submitted' || s === 'pending') return 'submitted';
  return 'processing';
}
