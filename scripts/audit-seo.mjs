import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const output = join(process.cwd(), "out");
if (!existsSync(output)) throw new Error("Missing out/. Run npm run build before npm run audit:seo.");
const htmlFiles = [];
function visit(directory) {
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    statSync(full).isDirectory() ? visit(full) : entry.endsWith(".html") && htmlFiles.push(full);
  }
}
visit(output);
const required = [/<title>[^<]+<\/title>/i, /<meta name="description" content="[^"]+"/i, /<link rel="canonical"/i];
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  for (const pattern of required) if (!pattern.test(html)) throw new Error(`${file} is missing ${pattern}`);
  for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt=("[^"]*"|'[^']*')/i.test(image[0])) throw new Error(`${file} has an image without alt text: ${image[0]}`);
  }
  if (/sourceMappingURL/i.test(html)) throw new Error(`${file} exposes a source map reference`);
}
for (const route of ["robots.txt", "sitemap.xml"]) if (!existsSync(join(output, route))) throw new Error(`Missing ${route}`);
console.log(`SEO audit passed for ${htmlFiles.length} HTML files.`);
