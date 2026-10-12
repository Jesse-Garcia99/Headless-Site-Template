import site from "../src/content/site.json";

interface Env {
  ASSETS: Fetcher;
}

const discovery: Record<string, { enabled?: boolean; entries?: unknown[]; spec?: unknown; card?: unknown; skills?: unknown[] }> =
  (site as { discovery?: Record<string, { enabled?: boolean; entries?: unknown[]; spec?: unknown; card?: unknown; skills?: unknown[] }> }).discovery ?? {};

// Link header advertising whichever discovery documents generate-discovery.mjs actually emitted,
// using registered relations. service-doc is per-API-catalog-entry (set inside the linkset
// document itself), not a site-wide HTML relation, so it isn't repeated here.
const discoveryLinkHeader = [
  discovery.apiCatalog?.enabled && discovery.apiCatalog.entries?.length ? '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"' : null,
  discovery.openapi?.enabled && discovery.openapi.spec ? '</openapi.json>; rel="service-desc"; type="application/json"' : null,
  discovery.agentCard?.enabled && discovery.agentCard.card ? '</.well-known/agent-card.json>; rel="describedby"; type="application/json"' : null,
  discovery.mcp?.enabled && discovery.mcp.card ? '</.well-known/mcp/server-card.json>; rel="describedby"; type="application/json"' : null,
]
  .filter((link): link is string => Boolean(link))
  .join(", ");

// generate-discovery.mjs writes extensionless files under /.well-known/ (matching RFC 8615
// convention); Cloudflare's static asset Content-Type inference needs an explicit override
// for those since it otherwise guesses from the (missing) extension.
function wellKnownContentType(pathname: string): string | null {
  if (!pathname.startsWith("/.well-known/")) return null;
  const lastSegment = pathname.slice(pathname.lastIndexOf("/") + 1);
  if (lastSegment.includes(".")) return null;
  return pathname === "/.well-known/api-catalog" ? "application/linkset+json" : "application/json";
}

const securityHeaders: Record<string, string> = {
  "Content-Security-Policy": "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; upgrade-insecure-requests",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
};

/** Paths that must never be served from the asset bundle (dotfiles, VCS, env, backups). */
function isBlockedPublicPath(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  if (path === "/.env" || path.startsWith("/.env.") || path === "/.dev.vars") return true;
  if (path === "/.git" || path.startsWith("/.git/")) return true;
  if (path === "/.wrangler" || path.startsWith("/.wrangler/")) return true;
  if (path === "/wrangler.jsonc" || path === "/wrangler.toml" || path === "/package.json" || path === "/package-lock.json") return true;
  if (path === "/tsconfig.json" || path === "/next.config.mjs" || path === "/next.config.js") return true;
  if (/\.(bak|backup|old|orig|swp)$/i.test(path)) return true;
  // Any other leading-dot segment in the path (e.g. /.github/, /.DS_Store)
  return /(^|\/)\.[^/]+/.test(path) && !path.startsWith("/.well-known/");
}

const contentSignal = "ai-train=no, search=yes, ai-input=no";
const markdownMediaType = /(?:^|,)\s*text\/markdown(?:\s*;[^,]*)?(?=,|$)/i;

function acceptsMarkdown(accept: string): boolean {
  return markdownMediaType.test(accept) && !/text\/markdown\s*;[^,]*\bq=0(?:\.0+)?\b/i.test(accept);
}

function markdownAssetPath(pathname: string): string | null {
  if (pathname.startsWith("/api/") || pathname.startsWith("/__agent-markdown/")) return null;
  const normalized = pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  if (/\.[a-z0-9]+$/i.test(normalized)) return null;
  const segments = normalized.split("/").filter(Boolean);
  return `/__agent-markdown/${segments.length ? `${segments.join("/")}/` : ""}index.md`;
}

function appendVary(headers: Headers, value: string) {
  const values = new Set((headers.get("vary") ?? "").split(",").map(item => item.trim().toLowerCase()).filter(Boolean));
  values.add(value.toLowerCase());
  headers.set("vary", [...values].join(", "));
}

function applyResponsePolicies(response: Response): Headers {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders)) headers.set(name, value);
  headers.set("Content-Signal", contentSignal);
  return headers;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (isBlockedPublicPath(url.pathname) || url.pathname.startsWith("/__agent-markdown/")) {
      const headers = new Headers(securityHeaders);
      headers.set("Content-Signal", contentSignal);
      return new Response("Not found", { status: 404, headers });
    }

    if (["GET", "HEAD"].includes(request.method) && acceptsMarkdown(request.headers.get("Accept") ?? "")) {
      url.pathname = markdownAssetPath(url.pathname) ?? url.pathname;
      url.search = "";
      const markdown = await env.ASSETS.fetch(new Request(url, request));
      if (markdown.ok && url.pathname.startsWith("/__agent-markdown/")) {
        const headers = applyResponsePolicies(markdown);
        headers.set("Content-Type", "text/markdown; charset=utf-8");
        appendVary(headers, "Accept");
        return new Response(request.method === "HEAD" ? null : markdown.body, { status: markdown.status, statusText: markdown.statusText, headers });
      }
    }

    const response = await env.ASSETS.fetch(request);
    if (url.pathname === "/robots.txt" && response.ok) {
      const body = await response.text();
      const robots = body.includes("Content-Signal:") ? body : `${body.trimEnd()}\nContent-Signal: ${contentSignal}\n`;
      const headers = applyResponsePolicies(response);
      headers.delete("Content-Length");
      return new Response(robots, { status: response.status, statusText: response.statusText, headers });
    }
    const headers = applyResponsePolicies(response);
    const wellKnownType = wellKnownContentType(url.pathname);
    if (wellKnownType) headers.set("Content-Type", wellKnownType);
    if (discoveryLinkHeader && (headers.get("Content-Type") ?? "").includes("text/html")) headers.set("Link", discoveryLinkHeader);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
