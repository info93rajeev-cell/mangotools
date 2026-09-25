import type { RegistryCategory, RegistryTool } from '@mangotools/schemas';
import { absolute, brand, siteUrl } from './site.ts';

const CONTEXT = 'https://schema.org';

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
    name: brand.name,
    url: siteUrl,
    logo: absolute(logoUrl),
    parentOrganization: { '@type': 'Organization', name: brand.parent },
  };
}

export function webSite() {
  return { '@context': CONTEXT, '@type': 'WebSite', name: brand.name, url: siteUrl };
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
    publisher: { '@type': 'Organization', name: brand.name, url: siteUrl },
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
