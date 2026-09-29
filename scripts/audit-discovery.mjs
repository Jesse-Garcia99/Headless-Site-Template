import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const output = join(root, "out");
if (!existsSync(output)) throw new Error("Missing out/. Run npm run build before npm run audit:discovery.");

const site = JSON.parse(readFileSync(join(root, "src/content/site.json"), "utf8"));
const siteUrl = site.siteUrl ?? "";

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`${path.slice(output.length)} is not valid JSON: ${error.message}`);
  }
}

// Resolves a same-site href/url to its file in out/, or null if it points elsewhere
// (an external domain, or a dynamic endpoint this static export can't serve).
function resolveLocalFile(pathname) {
  if (!pathname) return null;
  let path = pathname;
  if (siteUrl && path.startsWith(siteUrl)) path = path.slice(siteUrl.length) || "/";
  else if (!path.startsWith("/")) return null;
  path = path.split("#")[0].split("?")[0];
  const lastSegment = path.slice(path.lastIndexOf("/") + 1);
  const candidates = lastSegment.includes(".")
    ? [join(output, path)]
    : [join(output, path), join(output, `${path}.html`), join(output, path, "index.html"), join(output, path === "/" ? "index.html" : `${path.replace(/\/$/, "")}/index.html`)];
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

function requireLocalFile(name, pathname) {
  const file = resolveLocalFile(pathname);
  if (!file) return; // external URL; not this template's file to check
  if (!existsSync(file)) throw new Error(`${name} references "${pathname}", which does not resolve to a file in out/ (looked for ${file.slice(output.length)})`);
}

let checked = 0;

// --- api-catalog ---
const apiCatalogPath = join(output, ".well-known/api-catalog");
if (existsSync(apiCatalogPath)) {
  checked++;
  const doc = readJson(apiCatalogPath);
  if (!Array.isArray(doc.linkset)) throw new Error("api-catalog is missing a \"linkset\" array");
  for (const entry of doc.linkset) {
    if (!entry.anchor) throw new Error("api-catalog linkset entry is missing \"anchor\"");
    requireLocalFile("api-catalog anchor", entry.anchor);
    for (const rel of ["service-desc", "service-doc", "item"]) {
      for (const link of entry[rel] ?? []) {
        if (!link.href) throw new Error(`api-catalog "${rel}" entry is missing "href"`);
        requireLocalFile(`api-catalog ${rel}`, link.href);
      }
    }
  }
}

// --- openapi.json ---
const openapiPath = join(output, "openapi.json");
if (existsSync(openapiPath)) {
  checked++;
  const doc = readJson(openapiPath);
  if (!doc.openapi) throw new Error("openapi.json is missing \"openapi\" version field");
  if (!doc.info?.title || !doc.info?.version) throw new Error("openapi.json is missing \"info.title\" or \"info.version\"");
}

// --- agent-card.json ---
const agentCardPath = join(output, ".well-known/agent-card.json");
if (existsSync(agentCardPath)) {
  checked++;
  const doc = readJson(agentCardPath);
  for (const field of ["name", "description", "url", "version"]) {
    if (!doc[field]) throw new Error(`agent-card.json is missing required field "${field}"`);
  }
}

// --- agent-skills/index.json ---
const agentSkillsPath = join(output, ".well-known/agent-skills/index.json");
if (existsSync(agentSkillsPath)) {
  checked++;
  const doc = readJson(agentSkillsPath);
  if (!doc.$schema) throw new Error("agent-skills/index.json is missing \"$schema\"");
  if (!Array.isArray(doc.skills) || !doc.skills.length) throw new Error("agent-skills/index.json has no skills");
  for (const skill of doc.skills) {
    for (const field of ["name", "type", "description", "url", "digest"]) {
      if (!skill[field]) throw new Error(`agent-skills entry "${skill.name ?? "?"}" is missing "${field}"`);
    }
    const file = resolveLocalFile(skill.url);
    if (!file || !existsSync(file)) throw new Error(`agent-skills entry "${skill.name}" url "${skill.url}" does not resolve to a file in out/`);
    const actualDigest = `sha256:${createHash("sha256").update(readFileSync(file)).digest("hex")}`;
    if (actualDigest !== skill.digest) throw new Error(`agent-skills entry "${skill.name}" digest mismatch: index says ${skill.digest}, artifact hashes to ${actualDigest}`);
  }
}

// --- mcp/server-card.json ---
const mcpCardPath = join(output, ".well-known/mcp/server-card.json");
if (existsSync(mcpCardPath)) {
  checked++;
  const doc = readJson(mcpCardPath);
  for (const field of ["$schema", "description", "name", "version"]) {
    if (!doc[field]) throw new Error(`mcp/server-card.json is missing required field "${field}"`);
  }
}

// --- oauth-protected-resource (RFC 9728) ---
const prmPath = join(output, ".well-known/oauth-protected-resource");
if (existsSync(prmPath)) {
  checked++;
  const doc = readJson(prmPath);
  if (siteUrl && doc.resource && !String(doc.resource).startsWith(siteUrl)) {
    throw new Error(`oauth-protected-resource "resource" is ${doc.resource}, expected ${siteUrl}`);
  }
  if (!Array.isArray(doc.authorization_servers) || !doc.authorization_servers.length) {
    throw new Error("oauth-protected-resource is missing \"authorization_servers\"");
  }
  if (!doc.bearer_methods_supported?.includes("header")) {
    throw new Error("oauth-protected-resource must list \"header\" in bearer_methods_supported");
  }
}

// --- oauth-authorization-server / openid-configuration (RFC 8414 / OIDC) ---
for (const name of ["oauth-authorization-server", "openid-configuration"]) {
  const asPath = join(output, ".well-known", name);
  if (!existsSync(asPath)) continue;
  checked++;
  const doc = readJson(asPath);
  if (!doc.issuer) throw new Error(`.well-known/${name} is missing "issuer"`);
  if (!doc.jwks_uri) throw new Error(`.well-known/${name} is missing "jwks_uri"`);
  if (doc.agent_auth && (!doc.agent_auth.skill || !doc.agent_auth.register_uri || !doc.agent_auth.identity_types_supported?.length)) {
    throw new Error(`.well-known/${name} agent_auth is missing "skill", "register_uri", or "identity_types_supported"`);
  }
}

// --- auth.md ---
const authMdPath = join(output, "auth.md");
if (existsSync(authMdPath)) {
  checked++;
  const doc = readFileSync(authMdPath, "utf8");
  if (!/^#\s.*auth\.md/mi.test(doc)) throw new Error("auth.md needs an H1 heading containing \"auth.md\"");
}

// --- ai-catalog.json (ARD) ---
const aiCatalogPath = join(output, ".well-known/ai-catalog.json");
if (existsSync(aiCatalogPath)) {
  checked++;
  const doc = readJson(aiCatalogPath);
  if (!doc.specVersion) throw new Error("ai-catalog.json is missing \"specVersion\"");
  if (!doc.host?.displayName || !doc.host?.identifier) throw new Error("ai-catalog.json host needs \"displayName\" and \"identifier\"");
  if (!Array.isArray(doc.entries) || !doc.entries.length) throw new Error("ai-catalog.json has no \"entries\"");
  for (const entry of doc.entries) {
    for (const field of ["identifier", "displayName", "type"]) {
      if (!entry[field]) throw new Error(`ai-catalog entry ${entry.url ?? "?"} is missing "${field}"`);
    }
    if ((entry.url ? 1 : 0) + (entry.data ? 1 : 0) !== 1) throw new Error(`ai-catalog entry "${entry.identifier}" must carry exactly one of "url" or "data"`);
    if (entry.url) requireLocalFile(`ai-catalog entry ${entry.identifier}`, entry.url);
  }
}

// --- commerce discovery docs (only validate shape when they exist) ---
const acpPath = join(output, ".well-known/acp.json");
if (existsSync(acpPath)) {
  checked++;
  const doc = readJson(acpPath);
  if (doc.protocol?.name !== "acp" || !doc.protocol?.version) throw new Error("acp.json needs protocol.name \"acp\" and protocol.version");
  if (!doc.api_base_url || !Array.isArray(doc.transports) || !doc.transports.length) throw new Error("acp.json needs \"api_base_url\" and a non-empty \"transports\" array");
  if (!doc.capabilities?.services?.length) throw new Error("acp.json needs a non-empty \"capabilities.services\" array");
}
const ucpPath = join(output, ".well-known/ucp");
if (existsSync(ucpPath)) {
  checked++;
  const doc = readJson(ucpPath);
  for (const field of ["protocol_version", "services", "capabilities", "endpoints"]) {
    if (!doc[field]) throw new Error(`.well-known/ucp is missing "${field}"`);
  }
}

console.log(checked ? `Discovery audit passed for ${checked} document(s).` : "Discovery audit: nothing configured, nothing to validate.");
