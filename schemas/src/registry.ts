/**
 * Shapes of the files written by `pnpm gen` into generated/. Types only: the pipeline
 * produces these objects, and apps/web and packages/ui read them.
 */

import type { Manifest } from './manifest.ts';
import type { Preset, PresetField, PresetOutput, PresetUserOption } from './preset.ts';
import type { SiteConfig } from './site-config.ts';
import type { Category } from './taxonomy.ts';

export type Conditions = Record<string, string[]>;

/** A preset after `extends` is applied; what tool islands receive. */
export interface ResolvedPreset {
  id: string;
  version: string;
  operation: string;
  engineId: string;
  params: Record<string, unknown>;
  locked: string[];
  userOptions: Record<string, PresetUserOption>;
  fields: Record<string, PresetField>;
  outputs: Record<string, PresetOutput>;
  samples: NonNullable<Preset['samples']>;
  ui: NonNullable<Preset['ui']>;
  strings: Record<string, string>;
  /** English messages for the engine's error and warning codes, plus platform codes. */
  messages: Record<string, string>;
}

export interface ContentSection {
  id: string;
  title: string;
  html: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answerHtml: string;
  /** Plain text for FAQPage structured data. */
  answerText: string;
}

export type ExampleFormat = 'text' | 'money' | 'percent' | 'number' | 'code';

export interface ExampleRow {
  key: string;
  role: 'input' | 'output';
  label: string;
  value: string;
  format: ExampleFormat;
  primary: boolean;
}

export interface WorkedExample {
  fixtureId: string;
  rows: ExampleRow[];
}

export interface ToolContent {
  lastReviewed: string;
  sections: ContentSection[];
  faq: FaqItem[];
  example: WorkedExample | null;
}

export interface RegistryTool {
  id: string;
  slug: string;
  url: string;
  listed: boolean;
  status: Manifest['status'];
  tier: Manifest['tier'];
  version: string;
  changelog: Manifest['changelog'];
  name: string;
  shortName: string;
  summary: string;
  archetype: Manifest['archetype'];
  preset: string;
  sample: string | null;
  category: string;
  tags: string[];
  synonyms: string[];
  capabilities: NonNullable<Manifest['capabilities']>;
  privacy: Manifest['privacy'];
  disclaimer: Manifest['disclaimer'];
  seo: Manifest['seo'];
  related: string[];
  next: string[];
  quality: Manifest['quality'] | null;
  content: ToolContent;
}

export interface RegistryCategory extends Category {
  url: string;
  visible: boolean;
  /** Listed tools, in display order. */
  toolIds: string[];
}

export interface Registry {
  registryVersion: 1;
  site: SiteConfig;
  categories: RegistryCategory[];
  tools: RegistryTool[];
  presets: Record<string, ResolvedPreset>;
}

export interface SearchIndexTool {
  id: string;
  name: string;
  summary: string;
  url: string;
  category: string;
}

export interface SearchIndexFile {
  searchIndexVersion: 1;
  /** Serialized MiniSearch index (engines/search). */
  index: string;
  tools: SearchIndexTool[];
}
