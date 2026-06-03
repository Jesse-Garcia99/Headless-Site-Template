import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Headless Site Template",
  description: "A minimal Next.js + TinaCMS + Cloudflare Pages template",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
