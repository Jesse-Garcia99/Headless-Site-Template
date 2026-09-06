import site from "@/src/content/site.json";

export const siteUrl = new URL(site.siteUrl);

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
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
