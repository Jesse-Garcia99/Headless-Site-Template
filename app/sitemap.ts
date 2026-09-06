import type { MetadataRoute } from "next";
import { getAllPageSlugs, getPageData } from "@/lib/tina";
import { absoluteUrl } from "./seo";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllPageSlugs();
  const indexableSlugs = (await Promise.all(slugs.map(async (slug) => {
    const result = await getPageData(slug);
    return result.data.page.noIndex ? null : slug;
  }))).filter((slug): slug is string => Boolean(slug));
  return ["/", "/guide/", "/skills/", ...indexableSlugs.map((slug) => `/${slug}/`)].map((path) => ({ url: absoluteUrl(path), lastModified: new Date() }));
}
