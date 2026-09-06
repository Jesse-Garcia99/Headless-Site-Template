import type { Metadata } from "next";
import site from "@/src/content/site.json";
import { localBusinessJsonLd, siteUrl } from "./seo";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: site.title, template: `%s | ${site.title}` },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: site.title, images: [site.socialImage] },
  twitter: { card: "summary_large_image", images: [site.socialImage] },
  icons: { icon: site.favicon },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const businessJsonLd = localBusinessJsonLd();
  return (
    <html lang="en">
      <body>
        {children}
        {businessJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd).replace(/</g, "\\u003c") }} />}
      </body>
    </html>
  );
}
