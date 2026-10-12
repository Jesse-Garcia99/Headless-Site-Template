import site from "@/src/content/site.json";

export const siteUrl = new URL(site.siteUrl);

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

export type BreadcrumbItem = { name: string; path?: string };

/** BreadcrumbList JSON-LD that mirrors the visible trail (Home → … → current). */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  };
}

export function localBusinessJsonLd() {
  const business = site.localBusiness;
  if (!business?.enabled) return null;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name || site.title,
    url: site.siteUrl,
    ...(business.telephone && { telephone: business.telephone }),
    ...(business.email && { email: business.email }),
    address: {
      "@type": "PostalAddress",
      ...(business.streetAddress && { streetAddress: business.streetAddress }),
      ...(business.addressLocality && { addressLocality: business.addressLocality }),
      ...(business.addressRegion && { addressRegion: business.addressRegion }),
      ...(business.postalCode && { postalCode: business.postalCode }),
      ...(business.addressCountry && { addressCountry: business.addressCountry }),
    },
  };
}
