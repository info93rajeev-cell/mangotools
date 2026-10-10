import {
  type MarketplaceFeeDataset,
  type MarketplaceFeeIndex,
  marketplaceFeeDatasetSchema,
} from '@mangotools/schemas';
import { type Issue, issue, zodIssues } from './issues.ts';
import type { SourceFile } from './sources.ts';

export interface GeneratedMarketplaceFeeDataset {
  data: MarketplaceFeeDataset;
  outputPath: string;
  sourceFile: string;
}

export interface MarketplaceFeeOutput {
  datasets: GeneratedMarketplaceFeeDataset[];
  index: MarketplaceFeeIndex;
}

const PATH = /^reference\/marketplace-fees\/([^/]+)\/([^/]+)\.yaml$/;
const familyPlatform = (family: MarketplaceFeeDataset['family']) =>
  family.replace('marketplace-fees.', '');

function validatePath(source: SourceFile, dataset: MarketplaceFeeDataset): Issue[] {
  const match = PATH.exec(source.file);
  if (!match)
    return [
      issue(
        source.file,
        'Dataset path must be reference/marketplace-fees/<platform>/<version>.yaml.',
      ),
    ];
  const [, platform, version] = match;
  const issues: Issue[] = [];
  if (platform !== familyPlatform(dataset.family))
    issues.push(
      issue(source.file, 'Folder platform must match dataset family.', { path: 'family' }),
    );
  if (version !== dataset.version)
    issues.push(issue(source.file, 'Filename must match dataset version.', { path: 'version' }));
  return issues;
}

export function validateMarketplaceFeeDatasets(sources: SourceFile[]): {
  output: MarketplaceFeeOutput;
  issues: Issue[];
} {
  const issues: Issue[] = [];
  const datasets: GeneratedMarketplaceFeeDataset[] = [];
  const identities = new Set<string>();
  for (const source of sources) {
    const parsed = marketplaceFeeDatasetSchema.safeParse(source.data);
    if (!parsed.success) {
      issues.push(...zodIssues(source.file, parsed.error));
      continue;
    }
    issues.push(...validatePath(source, parsed.data));
    const identity = `${parsed.data.family}@${parsed.data.version}`;
    if (identities.has(identity)) {
      issues.push(issue(source.file, `Duplicate dataset identity "${identity}".`));
      continue;
    }
    identities.add(identity);
    const platform = familyPlatform(parsed.data.family);
    datasets.push({
      data: parsed.data,
      outputPath: `reference/marketplace-fees/${platform}/${parsed.data.version}.json`,
      sourceFile: source.file,
    });
  }
  datasets.sort((a, b) => a.outputPath.localeCompare(b.outputPath, 'en'));
  const published = datasets
    .filter(({ data }) => data.publicationStatus === 'published' && data.publishedDate)
    .map(({ data, outputPath }) => ({
      family: data.family,
      platform: familyPlatform(data.family) as MarketplaceFeeIndex['datasets'][number]['platform'],
      version: data.version,
      publishedDate: data.publishedDate as string,
      path: outputPath,
    }));
  return {
    output: { datasets, index: { marketplaceFeeIndexVersion: 1, datasets: published } },
    issues,
  };
}
