import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const output = join(root, "out");
if (!existsSync(output)) throw new Error("Missing out/. Run Next build before generating discovery documents.");

const site = JSON.parse(readFileSync(join(root, "src/content/site.json"), "utf8"));
const discovery = site.discovery ?? {};
const wellKnown = join(output, ".well-known");

function write(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, typeof value === "string" ? value : JSON.stringify(value, null, 2) + "\n");
  console.log(`discovery: wrote ${path.slice(output.length)}`);
}

function skip(name, reason) {
  console.log(`discovery: skipped ${name} (${reason})`);
}

// --- api-catalog: RFC 9727 linkset+json ---
const apiCatalog = discovery.apiCatalog ?? {};
if (!apiCatalog.enabled) {
  skip("api-catalog", "discovery.apiCatalog.enabled is false");
} else if (!apiCatalog.entries?.length) {
  skip("api-catalog", "discovery.apiCatalog.enabled is true but entries is empty");
} else {
  const linkset = apiCatalog.entries.map((entry) => {
    if (!entry.anchor) throw new Error("discovery.apiCatalog entries require an anchor");
    const item = { anchor: entry.anchor };
    if (entry.serviceDesc) item["service-desc"] = [{ href: entry.serviceDesc, type: entry.serviceDescType ?? "application/vnd.oai.openapi+json" }];
    if (entry.serviceDoc) item["service-doc"] = [{ href: entry.serviceDoc, type: entry.serviceDocType ?? "text/html" }];
    return item;
  });
  write(join(wellKnown, "api-catalog"), { linkset });
}

// --- openapi.json: pass-through document, only when the site declares APIs ---
const openapi = discovery.openapi ?? {};
if (!openapi.enabled) {
  skip("openapi.json", "discovery.openapi.enabled is false");
} else if (!openapi.spec) {
  skip("openapi.json", "discovery.openapi.enabled is true but spec is empty");
} else {
  write(join(output, "openapi.json"), openapi.spec);
}

// --- agent-card.json: A2A AgentCard ---
const agentCard = discovery.agentCard ?? {};
if (!agentCard.enabled) {
  skip("agent-card.json", "discovery.agentCard.enabled is false");
} else if (!agentCard.card) {
  skip("agent-card.json", "discovery.agentCard.enabled is true but card is empty");
} else {
  const required = ["name", "description", "url", "version"];
  const missing = required.filter((field) => !agentCard.card[field]);
  if (missing.length) throw new Error(`discovery.agentCard.card is missing required field(s): ${missing.join(", ")}`);
  write(join(wellKnown, "agent-card.json"), agentCard.card);
}

// --- agent-skills/index.json: Agent Skills Discovery RFC v0.2.0, with real sha256 digests ---
const agentSkills = discovery.agentSkills ?? {};
if (!agentSkills.enabled) {
  skip("agent-skills/index.json", "discovery.agentSkills.enabled is false");
} else if (!agentSkills.skills?.length) {
  skip("agent-skills/index.json", "discovery.agentSkills.enabled is true but skills is empty");
} else {
  const skillsDir = join(wellKnown, "agent-skills");
  const skills = agentSkills.skills.map((skill) => {
    for (const field of ["name", "type", "description", "source"]) {
      if (!skill[field]) throw new Error(`discovery.agentSkills.skills entry is missing "${field}"`);
    }
    if (!["skill-md", "archive"].includes(skill.type)) throw new Error(`discovery.agentSkills.skills["${skill.name}"].type must be "skill-md" or "archive"`);
    const sourcePath = join(root, skill.source);
    if (!statSync(sourcePath, { throwIfNoEntry: false })) throw new Error(`discovery.agentSkills.skills["${skill.name}"].source does not exist: ${skill.source}`);
    const bytes = readFileSync(sourcePath);
    const digest = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
    const relativeUrl = skill.type === "skill-md"
      ? `/.well-known/agent-skills/${skill.name}/SKILL.md`
      : `/.well-known/agent-skills/${skill.name}.tar.gz`;
    const destination = join(skillsDir, ...relativeUrl.replace("/.well-known/agent-skills/", "").split("/"));
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(sourcePath, destination);
    return { name: skill.name, type: skill.type, description: skill.description, url: relativeUrl, digest };
  });
  write(join(skillsDir, "index.json"), { $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json", skills });
}

const mcp = discovery.mcp ?? {};
if (!mcp.enabled) {
  skip("mcp/server-card.json", "discovery.mcp.enabled is false");
} else if (!mcp.card) {
  skip("mcp/server-card.json", "discovery.mcp.enabled is true but card is empty");
} else {
  const required = ["$schema", "description", "name", "version"];
  const missing = required.filter((field) => !mcp.card[field]);
  if (missing.length) throw new Error(`discovery.mcp.card is missing required field(s): ${missing.join(", ")}`);
  write(join(wellKnown, "mcp/server-card.json"), mcp.card);
}

console.log("Generated agent discovery documents.");
