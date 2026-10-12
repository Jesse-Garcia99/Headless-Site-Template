// Creates one GitHub issue per unchecked row in docs/launch-checklist.md.
// Existing titles are skipped across both open and closed issues.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const checklist = readFileSync(new URL("../docs/launch-checklist.md", import.meta.url), "utf8");
let section = "Launch";
const issues = [];

for (const line of checklist.split("\n")) {
  if (line.startsWith("## ")) section = line.slice(3).trim();
  if (!line.startsWith("- [ ] ")) continue;
  const body = line.slice(6).trim();
  const title = body
    .split(/\s+—\s+/u, 1)[0]
    .replace(/[`*]/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .slice(0, 180);
  const labels = ["launch"];
  if (section.startsWith("Human")) labels.push("human");
  if (section.startsWith("Agent readiness") || section.startsWith("Agent tooling")) labels.push("agent-readiness");
  if (section.startsWith("Localization")) labels.push("localization");
  if (/^(Core site|Policy|Security|CI)/.test(section)) labels.push("site");
  issues.push({ title, body, labels });
}

assert(issues.length > 0, "Launch checklist has no unchecked items.");
assert.equal(new Set(issues.map(({ title }) => title)).size, issues.length, "Launch issue titles must be unique.");

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8" }).trim();
}

if (process.argv.includes("--dry-run")) {
  for (const { title } of issues) console.log(`[launch] ${title}`);
  console.log(`Launch issues: ${issues.length} would be created.`);
  process.exit(0);
}

try { gh(["auth", "status"]); } catch { throw new Error("GitHub CLI authentication is required. Run `gh auth login` first."); }

const repo = JSON.parse(gh(["repo", "view", "--json", "isTemplate,nameWithOwner"]));
if (repo.isTemplate || repo.nameWithOwner === "Jesse-Garcia99/Headless-Site-Template") {
  console.log("Skipping launch issues: this is the template repository. Cloned sites file them via .github/workflows/launch-issues.yml.");
  process.exit(0);
}

for (const [label, color] of [
  ["launch", "0e8a16"],
  ["human", "d93f0b"],
  ["site", "1d76db"],
  ["localization", "c5def5"],
  ["agent-readiness", "5319e7"],
]) {
  try { gh(["label", "create", label, "--color", color, "--force"]); } catch {}
}

const existing = new Set(
  gh(["issue", "list", "--state", "all", "--limit", "500", "--json", "title", "--jq", ".[].title"])
    .split("\n")
    .filter(Boolean),
);

let created = 0;
for (const issue of issues) {
  const title = `[launch] ${issue.title}`;
  if (existing.has(title)) continue;
  gh([
    "issue", "create",
    "--title", title,
    "--body", `${issue.body}\n\n_Automated from docs/launch-checklist.md. Complete this item, record evidence, then close it._${issue.labels.includes("agent-readiness") ? " If this site has no such capability, close as **not planned** with evidence. Do not publish a fake document to pass a scanner. Monthly *Agent discovery honesty* keeps shipped items true." : ""}`,
    ...issue.labels.flatMap((label) => ["--label", label]),
  ]);
  created++;
}

console.log(`Launch issues: ${created} created, ${issues.length - created} already existed.`);
