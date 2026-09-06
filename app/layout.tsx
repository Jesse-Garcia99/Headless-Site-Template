import type { Metadata } from "next";
import site from "@/src/content/site.json";
import { localBusinessJsonLd, siteUrl } from "./seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: site.title, template: `%s | ${site.title}` },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.title,
    locale: "en_US",
    images: [{ url: site.socialImage, width: 1200, height: 630, alt: `${site.title} social preview` }],
  },
  twitter: { card: "summary_large_image", images: [site.socialImage] },
  icons: { icon: site.favicon },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const businessJsonLd = localBusinessJsonLd();
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.title,
    url: site.siteUrl,
    description: site.description,
  };
  return (
    <html lang="en">
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c") }} />
        {businessJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd).replace(/</g, "\\u003c") }} />}
      </body>
    </html>
  );
}
