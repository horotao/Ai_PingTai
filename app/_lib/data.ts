export type ModelKey =
  | 'gpt-image-2'
  | 'gpt-image-2-official'
  | 'gemini-3-pro-image-preview'
  | 'gemini-3-pro-image-preview-official'
  | 'gemini-3.1-flash-image-preview'
  | 'gemini-3.1-flash-image-preview-official';

export type ModelSpec = {
  key: ModelKey;
  label: string;
  sub: string;
  sizes: string[];
  sizes4k?: string[];
  resolutions?: string[];
  qualities?: string[];
  backgrounds?: string[];
  moderations?: string[];
  formats?: string[];
  maxN: number;
  features: string[];
  color: number;
  official: boolean;
  supportsOfficialFallback: boolean;
  supportsResolution: boolean;
  supportsQuality: boolean;
  supportsBackground: boolean;
  supportsModeration: boolean;
  supportsOutputFormat: boolean;
  supportsMask: boolean;
  supportsGoogleSearch: boolean;
  supportsGoogleImageSearch: boolean;
  maxRefs: number;
  maxFileSizeMb: number;
  slowResolutions?: string[];
};

export const DEFAULT_MODEL: ModelKey = 'gpt-image-2';

const COMMON_GPT_SIZES = ['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16', '21:9', '9:21', '2:1', '1:2', '4:5', '5:4'];
const GEMINI_PRO_SIZES = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
const GEMINI_FLASH_SIZES = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9', '1:4', '4:1', '1:8', '8:1'];

export const MODELS: Record<ModelKey, ModelSpec> = {
  'gpt-image-2': {
    key: 'gpt-image-2',
    label: 'gpt-image-2',
    sub: '标准渠道 · 轻量',
    sizes: COMMON_GPT_SIZES,
    sizes4k: ['16:9', '9:16', '2:1', '1:2', '21:9', '9:21'],
    resolutions: ['1k', '2k', '4k'],
    maxN: 1,
    features: ['文生图', '图生图'],
    color: 85,
    official: false,
    supportsOfficialFallback: true,
    supportsResolution: true,
    supportsQuality: false,
    supportsBackground: false,
    supportsModeration: false,
    supportsOutputFormat: false,
    supportsMask: false,
    supportsGoogleSearch: false,
    supportsGoogleImageSearch: false,
    maxRefs: 16,
    maxFileSizeMb: 8,
    slowResolutions: ['2k', '4k'],
  },
  'gpt-image-2-official': {
    key: 'gpt-image-2-official',
    label: 'gpt-image-2-official',
    sub: '官方渠道 · 4K',
    sizes: COMMON_GPT_SIZES,
    sizes4k: ['16:9', '9:16', '2:1', '1:2', '21:9', '9:21'],
    resolutions: ['1k', '2k', '4k'],
    qualities: ['auto', 'low', 'medium', 'high'],
    backgrounds: ['auto', 'opaque'],
    moderations: ['auto', 'low'],
    formats: ['png', 'jpeg', 'webp'],
    maxN: 4,
    features: ['文生图', '图生图', '局部重绘'],
    color: 210,
    official: true,
    supportsOfficialFallback: false,
    supportsResolution: true,
    supportsQuality: true,
    supportsBackground: true,
    supportsModeration: true,
    supportsOutputFormat: true,
    supportsMask: true,
    supportsGoogleSearch: false,
    supportsGoogleImageSearch: false,
    maxRefs: 16,
    maxFileSizeMb: 8,
    slowResolutions: ['2k', '4k'],
  },
  'gemini-3-pro-image-preview': {
    key: 'gemini-3-pro-image-preview',
    label: 'gemini-3-pro-image-preview',
    sub: 'Nano banana Pro · 标准渠道',
    sizes: GEMINI_PRO_SIZES,
    resolutions: ['1K', '2K', '4K'],
    maxN: 4,
    features: ['文生图', '图生图'],
    color: 38,
    official: false,
    supportsOfficialFallback: true,
    supportsResolution: true,
    supportsQuality: false,
    supportsBackground: false,
    supportsModeration: false,
    supportsOutputFormat: false,
    supportsMask: false,
    supportsGoogleSearch: false,
    supportsGoogleImageSearch: false,
    maxRefs: 14,
    maxFileSizeMb: 10,
    slowResolutions: ['2K', '4K'],
  },
  'gemini-3-pro-image-preview-official': {
    key: 'gemini-3-pro-image-preview-official',
    label: 'gemini-3-pro-image-preview-official',
    sub: 'Nano banana Pro · 官方渠道',
    sizes: GEMINI_PRO_SIZES,
    resolutions: ['1K', '2K', '4K'],
    maxN: 4,
    features: ['文生图', '图生图'],
    color: 24,
    official: true,
    supportsOfficialFallback: false,
    supportsResolution: true,
    supportsQuality: false,
    supportsBackground: false,
    supportsModeration: false,
    supportsOutputFormat: false,
    supportsMask: false,
    supportsGoogleSearch: false,
    supportsGoogleImageSearch: false,
    maxRefs: 14,
    maxFileSizeMb: 10,
    slowResolutions: ['2K', '4K'],
  },
  'gemini-3.1-flash-image-preview': {
    key: 'gemini-3.1-flash-image-preview',
    label: 'gemini-3.1-flash-image-preview',
    sub: 'Nano banana 2 · 标准渠道',
    sizes: GEMINI_FLASH_SIZES,
    resolutions: ['0.5K', '1K', '2K', '4K'],
    maxN: 4,
    features: ['文生图', '图生图', '搜索增强'],
    color: 130,
    official: false,
    supportsOfficialFallback: true,
    supportsResolution: true,
    supportsQuality: false,
    supportsBackground: false,
    supportsModeration: false,
    supportsOutputFormat: false,
    supportsMask: false,
    supportsGoogleSearch: true,
    supportsGoogleImageSearch: true,
    maxRefs: 14,
    maxFileSizeMb: 10,
    slowResolutions: ['2K', '4K'],
  },
  'gemini-3.1-flash-image-preview-official': {
    key: 'gemini-3.1-flash-image-preview-official',
    label: 'gemini-3.1-flash-image-preview-official',
    sub: 'Nano banana 2 · 官方渠道',
    sizes: GEMINI_FLASH_SIZES,
    resolutions: ['0.5K', '1K', '2K', '4K'],
    maxN: 4,
    features: ['文生图', '图生图', '搜索增强'],
    color: 146,
    official: true,
    supportsOfficialFallback: false,
    supportsResolution: true,
    supportsQuality: false,
    supportsBackground: false,
    supportsModeration: false,
    supportsOutputFormat: false,
    supportsMask: false,
    supportsGoogleSearch: true,
    supportsGoogleImageSearch: true,
    maxRefs: 14,
    maxFileSizeMb: 10,
    slowResolutions: ['2K', '4K'],
  },
};

export const QUICK_PROMPTS = [
  '月光下的竹林小径，薄雾，电影感',
  '赛博城市夜景，霓虹雨幕，低机位',
  '极简未来感海报，一只白色机械鹤',
  '东方山水与霓虹招牌融合，广角构图',
  '高质感产品广告图，玻璃与金属反射',
];

type SampleHistoryItem = {
  id: string;
  prompt: string;
  model: string;
  ratio: string;
  resolution?: string;
  n: number;
  status: 'completed' | 'failed';
  createdAt: number;
  error?: string;
};

export const SAMPLE_HISTORY: SampleHistoryItem[] = [
  { id: 'h-001', prompt: '日式庭院中漂浮的几何水晶，晨光柔和，极简构图', model: 'gpt-image-2', ratio: '3:2', n: 1, status: 'completed', createdAt: Date.now() - 1000 * 60 * 12 },
  { id: 'h-002', prompt: '深海霓虹生物群，半透明发光，冷调蓝紫色', model: 'gpt-image-2-official', ratio: '16:9', resolution: '2k', n: 4, status: 'completed', createdAt: Date.now() - 1000 * 60 * 60 * 2 },
  { id: 'h-003', prompt: '废土风格机械昆虫特写，齿轮结构复杂，电影感光影', model: 'gpt-image-2-official', ratio: '1:1', resolution: '4k', n: 2, status: 'failed', error: 'safety_policy_violation: 请调整提示词后重试', createdAt: Date.now() - 1000 * 60 * 60 * 26 },
  { id: 'h-004', prompt: '极简几何 logo，一只狐狸，线性，单色', model: 'gpt-image-2', ratio: '1:1', n: 1, status: 'completed', createdAt: Date.now() - 1000 * 60 * 60 * 50 },
  { id: 'h-005', prompt: '中式山水与霓虹招牌结合，水墨渐变，东方赛博', model: 'gpt-image-2-official', ratio: '21:9', resolution: '2k', n: 4, status: 'completed', createdAt: Date.now() - 1000 * 60 * 60 * 96 },
];

export function getModelSpec(model: string): ModelSpec {
  return MODELS[(model in MODELS ? model : DEFAULT_MODEL) as ModelKey];
}

export function getAvailableSizes(model: string | ModelSpec, resolution?: string): string[] {
  const spec = typeof model === 'string' ? getModelSpec(model) : model;
  if (resolution === '4k' && spec.sizes4k?.length) return spec.sizes4k;
  return spec.sizes;
}

export function isSlowModelResolution(model: string | ModelSpec, resolution?: string): boolean {
  const spec = typeof model === 'string' ? getModelSpec(model) : model;
  return Boolean(resolution && spec.slowResolutions?.includes(resolution));
}

export function fmtTime(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60_000) return '刚刚';
  if (d < 3_600_000) return `${Math.floor(d / 60_000)} 分钟前`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)} 小时前`;
  if (d < 7 * 86_400_000) return `${Math.floor(d / 86_400_000)} 天前`;
  const dt = new Date(ts);
  return `${dt.getMonth() + 1}月${dt.getDate()}日`;
}

export function clsx(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(' ');
}

export function hueFor(seed: unknown, salt: number | string = 0): number {
  let s = 0;
  const str = String(seed) + salt;
  for (let i = 0; i < str.length; i++) s = (s * 31 + str.charCodeAt(i)) >>> 0;
  return s % 360;
}
