import type { Metadata } from "next";
import Link from "next/link";

const repository = "https://github.com/mojavestudio/AISite";
const skillSource = `${repository}/blob/main/skills/create-site/SKILL.md`;
const rawSkill = "https://raw.githubusercontent.com/mojavestudio/AISite/main/skills/create-site/SKILL.md";

export const metadata: Metadata = {
  title: "Agent skills",
  description: "Open skills from Mojave Studio for building public-ready websites with Claude, ChatGPT, or Codex.",
  alternates: { canonical: "/skills/" },
};

export default function SkillsPage() {
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header shell compact-header"><Link className="wordmark" href="/">headless<span>.</span></Link><nav aria-label="Primary navigation"><Link href="/guide/">Guide</Link><Link href="/skills/">Skills</Link><a href={repository}>GitHub</a></nav></header>
    <main id="main-content" className="inner-page shell">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Skills</span></nav>
      <h1>Skills that make a better first draft.</h1>
      <p className="page-intro">The skills live in the public <a href={repository}>AISite repository</a>. This page explains how to hand one to an agent without creating a second, stale copy.</p>
      <article className="skill-page-card">
        <div><p className="section-label">Available now</p><h2><code>create-site</code></h2><p>Scaffold a new site with accessibility, SEO, social-preview, form, security, and release checks already accounted for.</p><a className="text-link" href={skillSource}>Inspect source on GitHub <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" /></svg></a></div>
        <div className="install-panel"><h3>Claude Code</h3><p>Clone AISite once, then symlink the skill into your personal skills directory.</p><pre><code>git clone {repository}.git ~/Documents/AISite{"\n"}ln -s ~/Documents/AISite/skills/create-site ~/.claude/skills/create-site</code></pre></div>
        <div className="install-panel"><h3>ChatGPT / Codex</h3><p>Point the agent at this site or give it the source URL below. It can read the skill directly from the repository.</p><a className="text-link" href={rawSkill}>Open raw SKILL.md <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" /></svg></a></div>
      </article>
      <p className="agent-note">For agents: <a href="/llms.txt">read the Headless llms.txt</a> for the current skill index and source links.</p>
    </main>
    <footer className="site-footer shell"><Link className="wordmark" href="/">headless<span>.</span></Link><p>Made by <a href="https://mojave.studio">Mojave Studio</a>.</p></footer>
  </>;
}
