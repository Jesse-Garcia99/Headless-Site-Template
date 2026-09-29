import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const output = join(root, "out");
if (!existsSync(output)) throw new Error("Missing out/. Run npm run build before npm run audit:seo.");

const site = JSON.parse(readFileSync(join(root, "src/content/site.json"), "utf8"));
const siteUrl = String(site.siteUrl || "").replace(/\/$/, "");
if (!/^https:\/\/[^/]+$/.test(siteUrl) || /example\.com$/i.test(siteUrl)) {
  throw new Error("siteUrl must be the production HTTPS custom domain, not example.com");
}

const htmlFiles = [];
function visit(directory) {
  for (const entry of readdirSync(directory)) {
    if (entry === "admin" || entry === "_next") continue;
    const full = join(directory, entry);
    statSync(full).isDirectory() ? visit(full) : entry.endsWith(".html") && htmlFiles.push(full);
  }
}
visit(output);

const is404 = file => file.endsWith("404.html") || file.includes("/404/");
const isHome = file => relative(output, file) === "index.html";
const required = [/<title>[^<]+<\/title>/i, /<meta name="description" content="[^"]+"/i, /<link rel="canonical"/i];
const seen = { titles: new Map(), descriptions: new Map(), canonicals: new Map() };
const placeholder = /lorem ipsum|your name here|your company here/i;
const viteLeak = /@vite\/client|__vite_ping|webpack-dev-server/i;
const emptySource = /\b(?:src|href)=["'](?:|#|javascript:void\(0\)?)["']/i;
let jsBytes = 0;

function walkAssets(directory) {
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== "admin") walkAssets(full);
      continue;
    }
    if (entry.endsWith(".js")) {
      const body = readFileSync(full, "utf8");
      if (/sourceMappingURL/i.test(body)) throw new Error(`${relative(output, full)} exposes a source map reference`);
      if (viteLeak.test(body)) throw new Error(`${relative(output, full)} ships a Vite/React overlay`);
      const size = statSync(full).size;
      jsBytes += size;
      if (size > 500_000) throw new Error(`${relative(output, full)} is ${size} bytes; keep public JS under 500KB`);
    }
  }
}
walkAssets(output);

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const name = relative(output, file);
  for (const pattern of required) if (!pattern.test(html)) throw new Error(`${name} is missing ${pattern}`);
  const headings = html.match(/<h1\b[^>]*>/gi) ?? [];
  if (headings.length !== 1) throw new Error(`${name} must have exactly one h1; found ${headings.length}`);
  for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt=("[^"]*"|'[^']*')/i.test(image[0])) throw new Error(`${name} has an image without alt text: ${image[0]}`);
  }
  if (emptySource.test(html)) throw new Error(`${name} has an empty, hash, or javascript:void source`);
  if (placeholder.test(html.replace(/<script[\s\S]*?<\/script>/gi, ""))) throw new Error(`${name} still contains placeholder copy`);
  if (!isHome(file) && !is404(file) && !/aria-label="Breadcrumb"/i.test(html)) {
    throw new Error(`${name} is missing breadcrumbs`);
  }
  if (!is404(file) && !/<script type="application\/ld\+json">/i.test(html)) {
    throw new Error(`${name} is missing structured data`);
  }
  if (!is404(file) && !/<link rel="icon"/i.test(html)) throw new Error(`${name} is missing a favicon link`);
  if (!is404(file) && !/property="og:image"/i.test(html) && !/name="twitter:image"/i.test(html) && !/"og:image"/.test(html)) {
    throw new Error(`${name} is missing a social share image`);
  }
  if (!is404(file) && !/<a\b[^>]+href="\/[^"]*"/i.test(html)) throw new Error(`${name} has no crawlable internal links`);
  const values = {
    titles: html.match(/<title>([^<]+)<\/title>/i)?.[1],
    descriptions: html.match(/<meta name="description" content="([^"]+)"/i)?.[1],
    canonicals: html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1],
  };
  if (is404(file)) continue;
  for (const [kind, value] of Object.entries(values)) {
    if (!value) continue;
    const firstFile = seen[kind].get(value);
    if (firstFile) throw new Error(`${name} duplicates ${kind.slice(0, -1)} from ${firstFile}`);
    seen[kind].set(value, name);
  }
}

for (const route of ["robots.txt", "sitemap.xml", "llms.txt", "404.html"]) {
  if (!existsSync(join(output, route))) throw new Error(`Missing ${route}`);
}
const favicon = String(site.favicon || "");
if (!favicon || !existsSync(join(output, favicon.replace(/^\//, "")))) throw new Error("Favicon is missing from the build output");
const social = String(site.socialImage || "");
if (!social || !existsSync(join(output, social.replace(/^\//, "")))) throw new Error("Social share image is missing from the build output");
if (site.localBusiness?.enabled && !htmlFiles.some(file => /LocalBusiness/.test(readFileSync(file, "utf8")))) {
  throw new Error("Local business schema is enabled but no LocalBusiness JSON-LD was found");
}

console.log(`SEO audit passed for ${htmlFiles.length} HTML files (${Math.round(jsBytes / 1024)} KB public JS).`);
