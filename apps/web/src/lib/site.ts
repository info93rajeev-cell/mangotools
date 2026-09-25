/// <reference types="node" />
/**
 * Build-time access to the generated registry and the active environment. Used only in page
 * front matter (server side); never import this from an island.
 */
import registryJson from '@generated/registry.json';
import type { Registry, RegistryCategory, RegistryTool, ResolvedPreset } from '@mangotools/schemas';
import type { ToolLink } from '@mangotools/ui/layout/types.ts';

export const registry = registryJson as unknown as Registry;

export const ENV = process.env.MANGOTOOLS_ENV ?? 'development';
const environment = registry.site.environments[ENV];
if (!environment) throw new Error(`Unknown MANGOTOOLS_ENV "${ENV}".`);

export const isDevelopment = ENV === 'development';
export const indexable = environment.indexable;
export const siteUrl = environment.url.replace(/\/$/, '');
export const brand = registry.site.brand;

/** Absolute URL for a site path, without a trailing slash. */
export const absolute = (path: string) => (path === '/' ? siteUrl : `${siteUrl}${path}`);

export const visibleCategories: RegistryCategory[] = registry.categories.filter((c) => c.visible);
export const listedTools: RegistryTool[] = registry.tools.filter((t) => t.listed);
export const toolById = new Map(registry.tools.map((t) => [t.id, t]));
export const categoryById = new Map(registry.categories.map((c) => [c.id, c]));

export const navCategories = visibleCategories.map((c) => ({ name: c.name, url: c.url }));

export function toolLink(tool: RegistryTool): ToolLink {
  return {
    id: tool.id,
    name: tool.name,
    summary: tool.summary,
    url: tool.url,
    professional: tool.tier === 'T1' || tool.tier === 'T2',
  };
}

export const toolLinks = (ids: string[]): ToolLink[] =>
  ids.flatMap((id) => {
    const tool = toolById.get(id);
    return tool?.listed ? [toolLink(tool)] : [];
  });

export const presetFor = (tool: RegistryTool): ResolvedPreset => {
  const preset = registry.presets[tool.preset];
  if (!preset) throw new Error(`Preset ${tool.preset} missing from the registry.`);
  return preset;
};

const SUFFIX = ` | ${brand.name}`;

/** Tool titles get the brand suffix only when the result stays within 60 characters. */
export function toolTitle(tool: RegistryTool): string {
  const withBrand = `${tool.seo.title}${SUFFIX}`;
  return [...withBrand].length <= 60 ? withBrand : tool.seo.title;
}

export const HOME = {
  title: 'MangoTools — Professional Tools That Run in Your Browser',
  description:
    'Free professional tools that run in your browser: GST and margin calculators, JSON formatter, Base64 and URL encoding. No uploads, no sign-up, no ads.',
};

export const ALL_TOOLS = {
  title: 'All Tools – Calculators, Converters and Developer Tools',
  description:
    'Browse every MangoTools tool: GST and profit margin calculators, a JSON formatter, Base64 and URL encoders. Free, no sign-up, and it all runs in your browser.',
};
