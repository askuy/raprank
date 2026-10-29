import { SITE } from './site';
import { outboundUrl, type Tool } from './data';

const abs = (href: string) => new URL(href, SITE.url).toString();

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
