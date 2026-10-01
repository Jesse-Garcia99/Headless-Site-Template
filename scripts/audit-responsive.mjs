import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const output = join(root, "out");
if (!existsSync(output)) throw new Error("Missing out/. Run npm run build before npm run audit:responsive.");

const htmlFiles = [];
const cssFiles = [];
function visit(directory) {
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== "admin") visit(full);
      continue;
    }
    if (entry.endsWith(".html")) htmlFiles.push(full);
    if (entry.endsWith(".css")) cssFiles.push(full);
  }
}
visit(output);

const rel = file => relative(output, file);
const sources = [
  ...cssFiles.map(file => ({ name: rel(file), css: readFileSync(file, "utf8") })),
  ...htmlFiles.map(file => ({
    name: `${rel(file)} inline <style>`,
    css: [...readFileSync(file, "utf8").matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join("\n"),
  })),
];

// Flatten each stylesheet into rules carrying their @media context.
const rules = [];
function parse(source, body, media = []) {
  let i = 0;
  while (i < body.length) {
    const open = body.indexOf("{", i);
    if (open === -1) return;
    const head = body.slice(i, open).trim();
    let depth = 1, j = open + 1;
    while (j < body.length && depth > 0) {
      if (body[j] === "{") depth++;
      else if (body[j] === "}") depth--;
      j++;
    }
    const inner = body.slice(open + 1, j - 1);
    if (/^@media/i.test(head)) parse(source, inner, [...media, head]);
    else if (head.startsWith("@")) parse(source, inner, media);
    else if (!/^(from|to|\d+(?:\.\d+)?%)$/.test(head)) rules.push({ source, selector: head, body: inner, media });
    i = j;
  }
}
const stripComments = css => css.replace(/\/\*\s*px-ok\b[\s\S]*?\*\//g, " px-ok ").replace(/\/\*[\s\S]*?\*\//g, "");
const allCss = sources.map(s => s.css).join("\n");
for (const { name, css } of sources) parse(name, stripComments(css));

// A fixed width is safe only where every viewport it can apply to is >= the width.
const widestGuard = rule => Math.max(0, ...rule.media.map(m => Number(
  m.match(/min-width\s*:\s*(\d+(?:\.\d+)?)px/i)?.[1] ?? m.match(/\(width\s*>=\s*(\d+(?:\.\d+)?)px/i)?.[1] ?? 0
)));
const covered = (rule, px) => widestGuard(rule) >= px;
// A width capped by max-width in the same rule cannot overflow — accept a
// percentage/fluid cap, or a px/rem cap at or below the mobile floor.
const capped = (rule) =>
  [...rule.body.matchAll(/(?:^|;)\s*max-width\s*:\s*([^;}]+)/gi)].some(m => {
    const v = m[1].trim().toLowerCase();
    if (/^\d+(?:\.\d+)?%$/.test(v) || /^(min|max|clamp|calc)\(/.test(v)) return true;
    const cap = v.match(/^(\d+(?:\.\d+)?)(px|rem)\b/);
    return cap ? Number(cap[1]) * (cap[2] === "rem" ? 16 : 1) <= MOBILE_FLOOR : false;
  });
const hasRule = (sel, decl) => rules.some(r => sel.test(r.selector) && decl.test(r.body));

const violations = [];
const MOBILE_FLOOR = 380;

for (const rule of rules) {
  if (rule.body.includes("px-ok")) continue;
  for (const m of rule.body.matchAll(/(?:^|;)\s*(min-width|width)\s*:\s*(\d+(?:\.\d+)?)(px|rem)\b/gi)) {
    const px = Number(m[2]) * (m[3].toLowerCase() === "rem" ? 16 : 1);
    if (px > MOBILE_FLOOR && !covered(rule, px) && !capped(rule)) {
      violations.push(`${rule.source}: ${rule.selector} sets ${m[1]}:${m[2]}${m[3]} — overflows viewports under ~${px}px`);
    }
  }
  const grid = rule.body.match(/grid-template-columns\s*:\s*([^;}]+)/i);
  if (grid) {
    const bare = grid[1].replace(/minmax\([^)]*\)/gi, "").replace(/repeat\(\s*\d+\s*,/gi, "");
    for (const m of bare.matchAll(/(\d+(?:\.\d+)?)(px|rem)\b/gi)) {
      const px = Number(m[1]) * (m[2].toLowerCase() === "rem" ? 16 : 1);
      if (px > MOBILE_FLOOR && !covered(rule, px) && !capped(rule)) {
        violations.push(`${rule.source}: ${rule.selector} has a ~${px}px grid track — overflows viewports under ~${px}px`);
      }
    }
  }
}

// overflow-x:hidden on the root masks breakage instead of fixing it — only OK
// when the layout demonstrably adapts (media queries or fluid techniques exist).
const fluid = /@media|@container|clamp\(|(?:^|[\s({;,])min\(|(?:^|[\s({;,])max\(/i.test(allCss);
const rootHidden = rules.some(r => /^(html|body)(,(html|body))*$/.test(r.selector.replace(/\s+/g, "")) && /overflow(-x)?\s*:\s*(hidden|clip)/i.test(r.body));
if (rootHidden && !fluid) {
  violations.push("html/body hides overflow but no media queries or fluid techniques exist — the overflow is masked, not fixed");
}

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  if (!/<html[\s>]/i.test(html) && !/<!doctype/i.test(html)) continue;
  const name = rel(file);
  const viewport = html.match(/<meta\b[^>]*>/gi)?.find(t => /name=["']viewport["']/i.test(t));
  if (!viewport || !/content=["'][^"']*width=device-width/i.test(viewport)) {
    violations.push(`${name} is missing <meta name="viewport" content="width=device-width…">`);
  }
  for (const m of html.matchAll(/style=["'][^"']*(?<![a-zA-Z-])(min-width|width)\s*:\s*(\d+(?:\.\d+)?)(px|rem)/gi)) {
    const px = Number(m[2]) * (m[3].toLowerCase() === "rem" ? 16 : 1);
    if (px > MOBILE_FLOOR) violations.push(`${name} has an inline fixed ~${px}px ${m[1]}`);
  }
  if (/<table\b/i.test(html) && !hasRule(/table/i, /overflow|display\s*:\s*block/i)) {
    violations.push(`${name} uses <table> with no scroll/block handling (e.g. table{display:block;overflow-x:auto} or a scroll wrapper)`);
  }
  if (/<pre\b/i.test(html) && !hasRule(/pre\b|code/i, /overflow|white-space\s*:\s*(pre-wrap|break-spaces|normal)|word-break/i)) {
    violations.push(`${name} uses <pre> with no overflow/wrap handling (e.g. pre{overflow-x:auto} or white-space:pre-wrap)`);
  }
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)];
  if (imgs.length && !hasRule(/\bimg\b/i, /max-width|height\s*:\s*auto/i) && imgs.some(i => !/style=["'][^"']*max-width/i.test(i[0]))) {
    violations.push(`${name} has <img> without a max-width constraint — add img{max-width:100%;height:auto}`);
  }
}

if (violations.length) throw new Error(`Responsive audit failed:\n- ${[...new Set(violations)].join("\n- ")}`);
console.log(`Responsive audit passed for ${htmlFiles.length} HTML files (${rules.length} CSS rules scanned).`);
