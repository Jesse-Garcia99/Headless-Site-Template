import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Publishing guide",
  description: "A practical checklist for taking an AI-assisted website from draft to public release.",
  alternates: { canonical: "/guide/" },
};

const checks = [
  ["Name the job", "Give the agent a real audience, goal, and constraint. A generic prompt makes generic work."],
  ["Design the information", "Start with a page hierarchy and clear routes. Use real headings and links that a person or crawler can follow."],
  ["Build the smallest useful thing", "Avoid adding libraries, motion, or client-side state unless they earn their place."],
  ["Make it public-ready", "Run the production build checklist below. `npm run audit:seo` fails the release if any automated item is missing."],
  ["Test the release", "Build the production output, check the console, inspect mobile, and make sure the 404, robots.txt, sitemap.xml, and forms behave honestly."],
];

const buildChecks = [
  ["No Vite or React overlay in the browser", "Production HTML must not load the Vite client, React Fast Refresh, or error overlays."],
  ["Internal links", "Every public page links to another real page on this site."],
  ["Custom domain", "siteUrl is the production HTTPS domain attached to the Worker."],
  ["Meta descriptions", "Each indexable page has a unique description."],
  ["Custom 404 page", "Unknown URLs render a real HTML 404 with a way home."],
  ["Breadcrumbs", "Inner pages expose a breadcrumb trail back to home."],
  ["Alt text on images", "Informative images have alt text. Decorative images use alt=\"\"."],
  ["Proper page sources", "No empty src, javascript:void, or hash-only primary links."],
  ["Unique headings", "Each page has exactly one descriptive h1."],
  ["Canonical tags", "Each indexable page has a unique canonical URL."],
  ["Structured data", "JSON-LD for the site, plus LocalBusiness when the business is local."],
  ["Unique page titles", "No two public pages share a title."],
  ["No console errors", "Production must not ship leftover debug logs or overlay errors."],
  ["No production source maps", "Built JavaScript must not include map files or map comments."],
  ["llms.txt", "A machine-readable site summary is published at /llms.txt."],
  ["robots.txt", "Crawlers get Allow/Disallow rules and a sitemap pointer."],
  ["Local business schema", "Enable LocalBusiness JSON-LD only when a public local address exists."],
  ["No placeholder copy", "No dummy filler paragraphs, leftover TODOs, or example domains in public titles and descriptions."],
  ["Favicon", "A real favicon is linked and present in the build output."],
  ["sitemap.xml", "Indexable routes are listed. Admin, API, and 404 are not."],
  ["Social share images", "Open Graph and Twitter images resolve to a real 1200x630 asset."],
  ["Small JS bundles", "Keep public JS lean. Admin tooling stays off the public pages."],
];

export default function GuidePage() {
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header shell compact-header">
      <Link className="wordmark" href="/">headless<span>.</span></Link>
      <nav aria-label="Primary navigation"><Link href="/guide/">Guide</Link><Link href="/skills/">Skills</Link><a href="https://github.com/mojavestudio/AISite">GitHub</a></nav>
    </header>
    <main id="main-content" className="inner-page shell">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Guide</span></nav>
      <h1>How to vibe code a site without shipping a mess.</h1>
      <p className="page-intro">Use the agent for speed. Use a clear standard for everything the first draft skips.</p>
      <ol className="guide-list">{checks.map(([title, body], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{title}</h2><p>{body}</p></div></li>)}</ol>
      <section className="build-check-block">
        <h2>On every production build</h2>
        <p className="page-intro">These ship with the template and are checked by <code>npm run audit:seo</code> after <code>npm run build</code>. Custom domain attachment still needs a human in Cloudflare.</p>
        <ol className="build-checks">{buildChecks.map(([title, body]) => <li key={title}><strong>{title}</strong><span>{body}</span></li>)}</ol>
      </section>
      <section className="guide-cta"><h2>Want the standard in the prompt?</h2><p>Start with the public <code>create-site</code> skill, then make the project your own.</p><Link className="button button-primary" href="/skills/">Open skills <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" /></svg></Link></section>
    </main>
    <footer className="site-footer shell"><Link className="wordmark" href="/">headless<span>.</span></Link><p>Made by <a href="https://mojave.studio">Mojave Studio</a>.</p></footer>
  </>;
}
