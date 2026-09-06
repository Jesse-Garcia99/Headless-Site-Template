import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Publishing guide",
  description: "A practical checklist for taking an AI-assisted website from draft to public release.",
  alternates: { canonical: "/guide/" },
};

const checks = [
  ["Name the job", "Give the agent a real audience, goal, and constraint. A generic prompt makes generic work."],
  ["Design the information", "Start with a page hierarchy and clear routes. Use real headings and links that a person—or crawler—can follow."],
  ["Build the smallest useful thing", "Avoid adding libraries, motion, or client-side state unless they earn their place."],
  ["Make it public-ready", "Write unique titles and descriptions, set canonical URLs, add social imagery, and give every informative image useful alt text."],
  ["Test the release", "Build the production output, check the console, inspect mobile, and make sure the 404, robots.txt, sitemap.xml, and forms behave honestly."],
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
      <section className="guide-cta"><h2>Want the standard in the prompt?</h2><p>Start with the public <code>create-site</code> skill, then make the project your own.</p><Link className="button button-primary" href="/skills/">Open skills <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" /></svg></Link></section>
    </main>
    <footer className="site-footer shell"><Link className="wordmark" href="/">headless<span>.</span></Link><p>Made by <a href="https://mojave.studio">Mojave Studio</a>.</p></footer>
  </>;
}
