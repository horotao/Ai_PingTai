// Data + constants for the app
const MODELS = {
  'gpt-image-2': {
    label: 'gpt-image-2',
    sub: '异步 · 轻量',
    sizes: ['1:1','3:2','2:3','4:3','3:4','16:9','9:16','21:9','9:21','2:1','1:2','4:5','5:4'],
    maxN: 1,
    features: ['文生图','图生图'],
    color: 85,
  },
  'gpt-image-2-official': {
    label: 'gpt-image-2-official',
    sub: '官方渠道 · 4K',
    sizes: ['1:1','3:2','2:3','4:3','3:4','16:9','9:16','21:9','9:21','2:1','1:2','4:5','5:4'],
    sizes4k: ['16:9','9:16','2:1','1:2','21:9','9:21'],
    resolutions: ['1k','2k','4k'],
    qualities: ['auto','low','medium','high'],
    backgrounds: ['auto','opaque'],
    moderations: ['auto','low'],
    formats: ['png','jpeg','webp'],
    maxN: 4,
    features: ['文生图','图生图','局部重绘'],
    color: 210,
  },
};

const QUICK_PROMPTS = [
  '极简赛博水族馆，鲸鱼在霓虹深海游弋',
  '废墟大教堂里的生态温室，柔和晨雾',
  '复古胶片风日式便利店，深夜霓虹',
  '悬浮岛屿与瀑布，蒸汽朋克风格',
  '极简宇航员坐在月球餐桌前喝咖啡',
];

const SAMPLE_HISTORY = [
  {
    id: 'h-001',
    prompt: '日式庭院中漂浮的几何水晶，晨光柔和，极简构图',
    model: 'gpt-image-2',
    ratio: '3:2',
    n: 1,
    status: 'completed',
    createdAt: Date.now() - 1000 * 60 * 12,
  },
  {
    id: 'h-002',
    prompt: '深海霓虹生物群，半透明发光，冷调蓝紫色',
    model: 'gpt-image-2-official',
    ratio: '16:9',
    resolution: '2k',
    n: 4,
    status: 'completed',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: 'h-003',
    prompt: '废土风格机械昆虫特写，齿轮结构复杂，电影感光影',
    model: 'gpt-image-2-official',
    ratio: '1:1',
    resolution: '4k',
    n: 2,
    status: 'failed',
    error: 'safety_policy_violation: 请调整提示词后重试',
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
  },
  {
    id: 'h-004',
    prompt: '极简几何 logo，一只狐狸，线性，单色',
    model: 'gpt-image-2',
    ratio: '1:1',
    n: 1,
    status: 'completed',
    createdAt: Date.now() - 1000 * 60 * 60 * 50,
  },
  {
    id: 'h-005',
    prompt: '中式山水 × 霓虹招牌，水墨渐变，东方赛博',
    model: 'gpt-image-2-official',
    ratio: '21:9',
    resolution: '2k',
    n: 4,
    status: 'completed',
    createdAt: Date.now() - 1000 * 60 * 60 * 96,
  },
];

function fmtTime(ts) {
  const d = Date.now() - ts;
  if (d < 60_000) return '刚刚';
  if (d < 3_600_000) return `${Math.floor(d/60_000)} 分钟前`;
  if (d < 86_400_000) return `${Math.floor(d/3_600_000)} 小时前`;
  if (d < 7 * 86_400_000) return `${Math.floor(d/86_400_000)} 天前`;
  const dt = new Date(ts);
  return `${dt.getMonth()+1}月${dt.getDate()}日`;
}

function clsx(...xs) { return xs.filter(Boolean).join(' '); }

Object.assign(window, { MODELS, QUICK_PROMPTS, SAMPLE_HISTORY, fmtTime, clsx });
