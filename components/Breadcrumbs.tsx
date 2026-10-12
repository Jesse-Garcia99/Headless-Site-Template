import Link from "next/link";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/app/seo";

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = breadcrumbJsonLd(items);
  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <span key={`${item.name}-${index}`} style={{ display: "contents" }}>
              {index > 0 && <span aria-hidden="true">/</span>}
              {item.path && !isLast ? (
                <Link href={item.path}>{item.name}</Link>
              ) : (
                <span>{item.name}</span>
              )}
            </span>
          );
        })}
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
