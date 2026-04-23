export type PriceRecord = {
  model: string;
  resolutions: string[];
  ratio?: string;
  quality?: string;
  currentPrice: string;
  officialPrice: string;
  savings: string;
};

type PriceLookupOptions = {
  resolution?: string;
  ratio?: string;
  quality?: string;
};

function stripCode(value: string): string {
  return value.replace(/`/g, '').trim();
}

function normalize(value?: string): string {
  return (value ?? '').trim().toLowerCase();
}

function splitMarkdownRow(line: string): string[] {
  return line.split('|').slice(1, -1).map((cell) => cell.trim());
}

function isDividerRow(cells: string[]): boolean {
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseResolutions(value: string): string[] {
  return stripCode(value).split('/').map((item) => item.trim()).filter(Boolean);
}

export function parsePriceMarkdown(markdown: string): PriceRecord[] {
  const records: PriceRecord[] = [];
  let currentModel = '';

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (!line.startsWith('|')) {
      if (line.endsWith('收费情况')) currentModel = '';
      continue;
    }

    const cells = splitMarkdownRow(line);
    if (!cells.length || isDividerRow(cells) || cells[0] === '型号') continue;

    const firstCell = stripCode(cells[0]);
    if (firstCell) currentModel = firstCell;
    if (!currentModel) continue;

    if (cells.length === 5) {
      records.push({
        model: currentModel,
        resolutions: parseResolutions(cells[1]),
        currentPrice: cells[2],
        officialPrice: cells[3],
        savings: cells[4],
      });
      continue;
    }

    if (cells.length === 7) {
      const ratio = stripCode(cells[2]);
      const quality = stripCode(cells[3]);

      records.push({
        model: currentModel,
        resolutions: parseResolutions(cells[1]),
        ratio: ratio === '-' ? undefined : ratio,
        quality: quality === '-' ? undefined : quality,
        currentPrice: cells[4],
        officialPrice: cells[5],
        savings: cells[6],
      });
    }
  }

  return records;
}

function matches(record: PriceRecord, options: PriceLookupOptions): boolean {
  const resolution = normalize(options.resolution);
  const ratio = normalize(options.ratio);
  const quality = normalize(options.quality);

  if (record.resolutions.length) {
    if (!resolution) return false;
    if (!record.resolutions.some((item) => normalize(item) === resolution)) return false;
  }

  if (record.ratio) {
    if (!ratio) return false;
    if (normalize(record.ratio) !== ratio) return false;
  }

  if (record.quality) {
    if (!quality) return false;
    if (normalize(record.quality) !== quality) return false;
  }

  return true;
}

function formatSummary(records: PriceRecord[]): string | null {
  if (!records.length) return null;
  return records
    .slice(0, 4)
    .map((record) => `${record.resolutions.join('/')} ${record.currentPrice}`)
    .join(' | ');
}

export function formatComposerPriceHint(
  prices: PriceRecord[],
  model: string,
  options: PriceLookupOptions,
): string | null {
  const records = prices.filter((record) => record.model === model);
  if (!records.length) return null;

  const exact = records.find((record) => matches(record, options));
  if (!exact) return formatSummary(records);

  const meta = [exact.resolutions.join('/'), exact.ratio, exact.quality].filter(Boolean).join(' | ');
  const prefix = meta ? `${meta} ` : '';
  return `${prefix}${exact.currentPrice} | Official ${exact.officialPrice} | Save ${exact.savings}`;
}
