import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TinaContentPage from "@/components/TinaContentPage";
import { getAllPageSlugs, getPageData } from "@/lib/tina";

export async function generateStaticParams() {
  return (await getAllPageSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const result = await getPageData(slug);
    const page = result.data.page;
    return {
      title: page.title,
      description: page.description || undefined,
      alternates: { canonical: `/${slug}/` },
      robots: page.noIndex ? { index: false, follow: true } : undefined,
    };
  } catch {
    return {};
  }
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const result = await getPageData(slug);
    if (!result.data.page) notFound();
    return <TinaContentPage data={result.data} variables={result.variables} query={result.query} />;
  } catch {
    notFound();
  }
}
