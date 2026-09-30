import type { RegistryCategory, RegistryTool } from '@mangotools/schemas';
import { absolute, brand, siteUrl } from './site.ts';

const CONTEXT = 'https://schema.org';
/** Stable node ids so WebSite and WebApplication can point at the same publisher. */
const ORGANIZATION_ID = `${siteUrl}/#organization`;
const WEBSITE_ID = `${siteUrl}/#website`;

export interface Crumb {
  name: string;
  url: string;
}

export function breadcrumbList(items: Crumb[]) {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absolute(item.url),
    })),
  };
}

export function organization(logoUrl: string) {
  return {
    '@context': CONTEXT,
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: brand.name,
    url: siteUrl,
    logo: absolute(logoUrl),
    ...(brand.parent
      ? { parentOrganization: { '@type': 'Organization', name: brand.parent } }
      : {}),
  };
}

export function webSite() {
  return {
    '@context': CONTEXT,
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: brand.name,
    url: siteUrl,
    publisher: { '@id': ORGANIZATION_ID },
  };
}

export function itemList(category: RegistryCategory, tools: RegistryTool[]) {
  return {
    '@context': CONTEXT,
    '@type': 'ItemList',
    name: category.name,
    itemListElement: tools.map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: tool.name,
      url: absolute(tool.url),
    })),
  };
}

const APPLICATION_CATEGORY: Record<string, string> = {
  business: 'BusinessApplication',
  developer: 'DeveloperApplication',
};

export function webApplication(tool: RegistryTool) {
  return {
    '@context': CONTEXT,
    '@type': 'WebApplication',
    name: tool.name,
    description: tool.seo.description,
    url: absolute(tool.url),
    applicationCategory: APPLICATION_CATEGORY[tool.category] ?? 'UtilitiesApplication',
    operatingSystem: 'Any (web browser)',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@type': 'Organization', '@id': ORGANIZATION_ID, name: brand.name, url: siteUrl },
  };
}

export function faqPage(items: { question: string; answerText: string }[]) {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answerText },
    })),
  };
}
