import { SITE } from './site';
import { outboundUrl, type Tool } from './data';

const abs = (href: string) => new URL(href, SITE.url).toString();

export const ORG_ID = `${SITE.url}/#organization`;
export const WEBSITE_ID = `${SITE.url}/#website`;

/** Home page only; other pages reference these by @id. */
export function siteNodes() {
  return [
    {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: SITE.name,
      url: SITE.url,
      logo: abs('/logo.png'),
      sameAs: ['https://github.com/askuy/raprank'],
    },
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      name: SITE.name,
      url: SITE.url,
      inLanguage: 'en',
      publisher: { '@id': ORG_ID },
      potentialAction: { '@type': 'SearchAction', target: `${SITE.url}/search?q={q}`, 'query-input': 'required name=q' },
    },
  ];
}

/** Directory-style pages (categories, rankings, alternatives): a CollectionPage whose main entity is the list. */
export function collectionPageSchema(name: string, path: string, description: string, tools: Tool[]) {
  return {
    '@type': 'CollectionPage',
    '@id': `${abs(path)}#page`,
    url: abs(path),
    name,
    description,
    mainEntity: itemListSchema(name, tools),
  };
}

export function breadcrumbSchema(items: { name: string; href: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', href: '/' }, ...items].map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.href),
    })),
  };
}

export function itemListSchema(name: string, tools: Tool[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: tools.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.data.name,
      url: abs(`/tool/${t.id}`),
    })),
  };
}

export function faqSchema(faq: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function softwareSchema(t: Tool) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: t.data.name,
    url: outboundUrl(t),
    description: t.data.tagline,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    ...(t.data.pricing === 'free' && { offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' } }),
  };
}

/** Plain page node for hubs and static pages (AboutPage, WebPage, CollectionPage without a list). */
export function webPageSchema(type: 'WebPage' | 'AboutPage' | 'CollectionPage', name: string, path: string, description: string) {
  return { '@type': type, '@id': `${abs(path)}#page`, url: abs(path), name, description };
}

/** Browser tools (generators, arena). */
export function webAppSchema(name: string, path: string, description: string) {
  return {
    '@type': 'WebApplication',
    name,
    url: abs(path),
    description,
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
}
