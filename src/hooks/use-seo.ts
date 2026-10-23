import { useEffect } from 'react';
import { trpc } from '@/providers/trpc';

// ============================================================
// SEO hook — upravlja <title>, meta/OG/Twitter tagovima,
// canonical linkom i JSON-LD skriptom. SPA: tagovi se
// postavljaju klijentski; staticki fallback je u index.html.
// ============================================================

export type SeoInput = {
  title?: string;
  description?: string;
  /** apsolutni ili relativni URL slike */
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function setMeta(attr: 'name' | 'property', key: string, content: string | null) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (content == null || content === '') {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string | null) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

export function useSeo(input: SeoInput) {
  const { title, description, image, type, noindex, jsonLd } = input;
  const jsonLdStr = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    const origin = window.location.origin;
    const url = origin + window.location.pathname;
    const absImage = image
      ? image.startsWith('http')
        ? image
        : origin + image
      : null;

    if (title) document.title = title;
    setMeta('name', 'description', description ?? null);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : null);

    setMeta('property', 'og:title', title ?? null);
    setMeta('property', 'og:description', description ?? null);
    setMeta('property', 'og:type', type ?? 'website');
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', absImage);
    setMeta('property', 'og:locale', 'hr_HR');

    setMeta('name', 'twitter:card', absImage ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', title ?? null);
    setMeta('name', 'twitter:description', description ?? null);
    setMeta('name', 'twitter:image', absImage);

    setCanonical(noindex ? null : url);

    let script: HTMLScriptElement | null = null;
    if (jsonLdStr) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = jsonLdStr;
      document.head.appendChild(script);
    }

    return () => {
      script?.remove();
    };
  }, [title, description, image, type, noindex, jsonLdStr]);
}

/** site-wide postavke iz baze (brending + SEO) */
export function useSiteSettings() {
  const { data } = trpc.settings.getAll.useQuery(undefined, { staleTime: 60_000 });
  return {
    siteName: data?.siteName ?? 'Adriatic Stays',
    defaultDescription: data?.seoDescription ?? '',
    defaultOgImage: data?.seoOgImage ?? '',
    contactEmail: data?.contactEmail ?? '',
    contactPhone: data?.contactPhone ?? '',
    contactCity: data?.contactCity ?? '',
    footerTagline: data?.footerTagline ?? '',
  };
}
