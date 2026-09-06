import type { MetadataRoute } from "next";
import { getAllPageSlugs } from "@/lib/tina";
import { absoluteUrl } from "./seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllPageSlugs();
  return ["/", ...slugs.map((slug) => `/${slug}/`)].map((path) => ({ url: absoluteUrl(path), lastModified: new Date() }));
}
