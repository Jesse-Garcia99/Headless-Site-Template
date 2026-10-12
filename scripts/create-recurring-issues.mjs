import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";

const issues = [
  ["Search visibility review", "Review Search Console indexing, sitemap coverage, canonical reports, search queries, and generative-AI visibility. Record changes worth making; do not create filler pages for keyword variants."],
  ["Content and localization freshness", "Review public copy, screenshots, prices, downloads, policy text, and supported locales. Update source strings first, run the localization workflow, then verify hreflang and sitemap coverage."],
  ["Production crawler and accessibility spot check", "Check the deployed site in a browser and verify robots.txt, sitemap.xml, response headers, Markdown negotiation, structured data, keyboard use, responsive layouts, and a clean console."],
  ["Agent discovery honesty", "Re-scan the production URL with POST https://isitagentready.com/api/scan. Keep robots.txt AI crawler groups, Content-Signal, sitemap.xml, Link headers, and every enabled well-known document true. Disable anything that 404s or overclaims. Close not-planned items that still do not apply. Do not add fake A2A, MCP, OAuth, or commerce documents to chase a scanner score."],
];

const dryRun = process.argv.includes("--dry-run");
const selfCheck = process.argv.includes("--self-check");
const period = process.env.RECURRENCE_KEY || new Date().toISOString().slice(0, 7);

function isDue(title, openTitles) {
  const prefix = `[recurring] ${title} —`;
  return !openTitles.some((existing) => existing.startsWith(prefix));
}

if (selfCheck) {
  assert.equal(isDue("Search visibility review", []), true);
  assert.equal(isDue("Search visibility review", ["[recurring] Search visibility review — 2026-10"]), false);
  assert.equal(isDue("Search visibility review", ["[recurring] Another review — 2026-10"]), true);
  console.log("Recurring issue self-check passed.");
  process.exit(0);
}

if (dryRun) {
  for (const [title] of issues) console.log(`[recurring] ${title} — ${period}`);
  process.exit(0);
}

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8" }).trim();
}

gh(["auth", "status"]);
const repo = JSON.parse(gh(["repo", "view", "--json", "isTemplate,nameWithOwner"]));
if (repo.isTemplate || repo.nameWithOwner === "Jesse-Garcia99/Headless-Site-Template") {
  console.log("Skipping recurring issues: this is the template repository. Cloned sites file them via .github/workflows/recurring-issues.yml.");
  process.exit(0);
}
for (const [label, color] of [["recurring", "5319e7"], ["maintenance", "fbca04"]]) {
  try { gh(["label", "create", label, "--color", color, "--force"]); } catch {}
}

const openTitles = gh(["issue", "list", "--state", "open", "--limit", "500", "--json", "title", "--jq", ".[].title"])
  .split("\n")
  .filter(Boolean);

let created = 0;
for (const [title, body] of issues) {
  const prefix = `[recurring] ${title} —`;
  if (!isDue(title, openTitles)) continue;
  gh(["issue", "create", "--title", `${prefix} ${period}`, "--body", `${body}\n\nClose this issue when the review is complete. The next scheduled run will create a fresh one.`, "--label", "recurring", "--label", "maintenance"]);
  created++;
}

console.log(`Recurring issues: ${created} created, ${issues.length - created} still open.`);
