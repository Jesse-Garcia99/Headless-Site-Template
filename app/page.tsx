import Link from "next/link";

const createSiteSkill = "https://github.com/mojavestudio/AISite/blob/main/skills/create-site/SKILL.md";
const aiSiteRepository = "https://github.com/mojavestudio/AISite";
const templateRepository = "https://github.com/Jesse-Garcia99/Headless-Site-Template";

function Arrow() {
  return <span className="arrow" aria-hidden="true">↗</span>;
}

function ReleaseSignal() {
  return (
    <div className="release-signal" aria-hidden="true">
      <div className="signal-index signal-index-top"><span>01</span><span>draft</span></div>
      <div className="signal-ribbon"><span>headless</span><i /><i /><i /></div>
      <div className="signal-stamp">READY<br />FOR<br />PUBLIC</div>
      <div className="signal-index signal-index-bottom"><span>05</span><span>released</span></div>
      <p className="signal-caption">A release is more than a deploy.</p>
    </div>
  );
}

export default function HomePage() {
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header shell">
      <Link className="wordmark" href="/" aria-label="Headless home">HEADLESS<span>®</span></Link>
      <nav aria-label="Primary navigation">
        <Link href="/guide/">Guide</Link>
        <Link href="/skills/">Skills</Link>
        <a href={aiSiteRepository}>GitHub</a>
      </nav>
      <a className="header-action" href={createSiteSkill}>GET THE SKILL <Arrow /></a>
    </header>

    <main id="main-content">
      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow">MOJAVE STUDIO / PUBLIC RESOURCE</p>
          <h1><span>MAKE IT</span><br /><em>REAL.</em></h1>
          <p className="hero-intro">The release standard for sites built with AI. A clear path from first draft to something people can actually use, find, and trust.</p>
          <div className="actions">
            <Link className="button button-primary" href="/guide/">READ THE GUIDE <Arrow /></Link>
            <Link className="button button-quiet" href="/skills/">INSTALL A SKILL <Arrow /></Link>
          </div>
        </div>
        <ReleaseSignal />
      </section>

      <section className="manifesto shell" aria-labelledby="manifesto-heading">
        <p className="eyebrow">THE POINT</p>
        <h2 id="manifesto-heading">An agent can make a page.<br />A standard makes a site.</h2>
        <div className="manifesto-tail">
          <p>Headless is the small, unglamorous layer between “the demo works” and a considered public release: content structure, access, search, security, and the final checks people forget when they move fast.</p>
          <Link className="inline-link" href="/guide/">See the release sequence <Arrow /></Link>
        </div>
      </section>

      <section className="release-section" aria-labelledby="release-heading">
        <div className="shell release-layout">
          <div className="release-title">
            <p className="eyebrow">THE RELEASE SEQUENCE</p>
            <h2 id="release-heading">FIVE THINGS<br />THAT HOLD.</h2>
          </div>
          <ol className="release-list">
            {[
              ["01", "Clear intent", "Give the agent an audience, a goal, and a point of view."],
              ["02", "Real structure", "Use meaningful headings, routes, and links people can follow."],
              ["03", "Findable by default", "Give each page its metadata, canonical URL, robots rules, and sitemap."],
              ["04", "Built for people", "Make the content legible, responsive, keyboard-friendly, and accessible."],
              ["05", "Checked before launch", "Build production output, remove the loose ends, and test the honest result."],
            ].map(([number, title, description]) => <li key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}
          </ol>
        </div>
      </section>

      <section className="skill-callout shell" aria-labelledby="skill-heading">
        <div>
          <p className="eyebrow">THE SHORTCUT THAT ISN’T A COP-OUT</p>
          <h2 id="skill-heading">GIVE YOUR<br /><em>AGENT</em> A STANDARD.</h2>
        </div>
        <div className="skill-callout-copy">
          <p>The open <code>create-site</code> skill starts an agent with the quality checks that are easy to miss in the rush to generate.</p>
          <a className="button button-primary" href={createSiteSkill}>GET CREATE-SITE <Arrow /></a>
          <a className="inline-link" href={templateRepository}>Explore the template <Arrow /></a>
        </div>
      </section>
    </main>

    <footer className="site-footer shell">
      <Link className="wordmark" href="/">HEADLESS<span>®</span></Link>
      <p>A public resource by <a href="https://mojave.studio">Mojave Studio</a>.</p>
    </footer>
  </>;
}
