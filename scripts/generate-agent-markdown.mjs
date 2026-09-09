import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const output = join(process.cwd(), "out");
const markdownRoot = join(output, "__agent-markdown");

function decodeHtml(value) {
  return value
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&(amp|quot|lt|gt|nbsp);/g, (_, entity) => ({ amp: "&", quot: '"', lt: "<", gt: ">", nbsp: " " })[entity]);
}

function markdownFromHtml(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? "";
  return decodeHtml(main
    .replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<a\b[^>]*\bhref=(?:"([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gi, (_, a, b, label) => `[${label}](${a || b})`)
    .replace(/\[\s*\]\([^)]*\)/g, "")
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, content) => `\n\n${"#".repeat(Number(level))} ${content}\n\n`)
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1")
    .replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, "\n\n$1\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:section|article|div|details|summary|ol|ul)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim());
}

function routeFor(file) {
  const relativePath = relative(output, file).replaceAll("\\", "/");
  if (relativePath === "index.html") return "/";
  if (relativePath.endsWith("/index.html")) return `/${relativePath.slice(0, -"index.html".length)}`;
  return `/${relativePath.replace(/\.html$/, "")}/`;
}

function visit(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    if (["admin", "__agent-markdown"].includes(entry)) continue;
    const file = join(directory, entry);
    if (statSync(file).isDirectory()) visit(file, files);
    else if (entry.endsWith(".html") && entry !== "404.html") files.push(file);
  }
  return files;
}

if (!statSync(output).isDirectory()) throw new Error("Missing out/. Run Next build before generating agent Markdown.");
rmSync(markdownRoot, { recursive: true, force: true });
for (const file of visit(output)) {
  const html = readFileSync(file, "utf8");
  const route = routeFor(file);
  const title = decodeHtml(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "Untitled");
  const description = decodeHtml(html.match(/<meta name="description" content="([^"]*)"/i)?.[1] ?? "");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] ?? route;
  const destination = join(markdownRoot, ...route.split("/").filter(Boolean), "index.md");
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\nurl: ${JSON.stringify(canonical)}\n---\n\n${markdownFromHtml(html)}\n`);
}

console.log("Generated Markdown variants for agent content negotiation.");
