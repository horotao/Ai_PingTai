import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Workspace } from './_components/Workspace';
import { parsePriceMarkdown, type PriceRecord } from './_lib/pricing';

export default async function Home() {
  let prices: PriceRecord[] = [];

  try {
    const markdown = await readFile(path.join(process.cwd(), 'docs', 'Prices.md'), 'utf8');
    prices = parsePriceMarkdown(markdown);
  } catch {}

  return <Workspace prices={prices} />;
}
