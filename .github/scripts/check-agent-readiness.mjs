#!/usr/bin/env node
// Calls the isitagentready.com scanner for SITE_URL and fails the process when
// any check the site has opted into is not "pass".
//
// NOTE: We have not seen a real response from this API, so parsing here is
// deliberately defensive rather than locked to one assumed schema. It accepts:
//   - { checks: [{ id | name | check, status | result }] }
//   - { checks: { <name>: "pass" | { status: "pass" } } }
// A check is treated as "not opted into" (skipped, not failed) when its status
// is one of: skip, skipped, n/a, na, not_applicable, not-applicable, none.
// Anything else that isn't a case-insensitive "pass" is a failure.

const SCAN_ENDPOINT = "https://isitagentready.com/api/scan";
const SKIP_STATUSES = new Set([
  "skip",
  "skipped",
  "n/a",
  "na",
  "not_applicable",
  "not-applicable",
  "none",
]);

function summaryLine(name, status) {
  const normalized = String(status ?? "unknown").toLowerCase();
  if (normalized === "pass") return `PASS  ${name}`;
  if (SKIP_STATUSES.has(normalized)) return `SKIP  ${name} (not opted in)`;
  return `FAIL  ${name} -> ${status}`;
}

function normalizeChecks(body) {
  const raw = body?.checks;
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.map((entry, i) => ({
      name: entry?.id ?? entry?.name ?? entry?.check ?? `check_${i}`,
      status: entry?.status ?? entry?.result ?? entry?.state,
    }));
  }

  if (typeof raw === "object") return flatten(raw);

  return [];
}

// The scanner nests checks by group -- checks.discovery.apiCatalog.status,
// checks.discoverability.linkHeaders.status, checks.commerce.acp.status -- so
// walk one level down when an entry has no status of its own.
function flatten(node, prefix = "", depth = 0) {
  return Object.entries(node).flatMap(([name, value]) => {
    const path = prefix ? `${prefix}.${name}` : name;
    if (typeof value === "string") return [{ name: path, status: value }];
    if (value && typeof value === "object") {
      const status = value.status ?? value.result ?? value.state;
      if (typeof status === "string") return [{ name: path, status }];
      if (depth < 3) return flatten(value, path, depth + 1);
    }
    return [];
  });
}

async function main() {
  const siteUrl = process.env.SITE_URL;

  if (!siteUrl) {
    const msg =
      "SITE_URL is not set (no repo variable `vars.SITE_URL` and no fallback) " +
      "— skipping the agent-readiness scan. This is expected on a fresh fork " +
      "with nothing deployed yet.";
    console.log(msg);
    await appendSummary(`## Agent readiness scan\n\nSkipped: ${msg}\n`);
    process.exit(0);
  }

  console.log(`Scanning ${siteUrl} via ${SCAN_ENDPOINT} ...`);

  let response;
  try {
    response = await fetch(SCAN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: siteUrl }),
    });
  } catch (err) {
    await failScannerDown(`Could not reach the scanner: ${err.message}`);
    return;
  }

  if (!response.ok) {
    await failScannerDown(
      `Scanner returned HTTP ${response.status} ${response.statusText}`,
    );
    return;
  }

  let body;
  try {
    body = await response.json();
  } catch (err) {
    await failScannerDown(`Scanner response was not valid JSON: ${err.message}`);
    return;
  }

  const checks = normalizeChecks(body);

  if (checks.length === 0) {
    await failScannerDown(
      "Scanner response did not contain a recognizable `checks` field. " +
        "Raw response has been printed to the job log for inspection.",
    );
    console.log(JSON.stringify(body, null, 2));
    return;
  }

  const lines = checks.map((c) => summaryLine(c.name, c.status));
  const failed = checks.filter(
    (c) => !SKIP_STATUSES.has(String(c.status ?? "").toLowerCase()) &&
      String(c.status ?? "").toLowerCase() !== "pass",
  );

  console.log(lines.join("\n"));

  const summaryBody = [
    "## Agent readiness scan",
    "",
    `Scanned: \`${siteUrl}\``,
    "",
    "| Check | Status |",
    "| --- | --- |",
    ...checks.map((c) => `| ${c.name} | ${c.status ?? "unknown"} |`),
    "",
  ].join("\n");
  await appendSummary(summaryBody);

  if (failed.length > 0) {
    console.error(
      `\n${failed.length} agent-readiness check(s) failed: ${failed
        .map((c) => c.name)
        .join(", ")}`,
    );
    process.exit(1);
  }

  console.log("\nAll opted-in agent-readiness checks passed.");
}

async function failScannerDown(message) {
  console.error(`SCANNER UNREACHABLE OR ERRORED: ${message}`);
  await appendSummary(
    `## Agent readiness scan\n\n**Scanner unreachable or errored** (not a site regression): ${message}\n`,
  );
  process.exit(1);
}

async function appendSummary(text) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  const { appendFile } = await import("node:fs/promises");
  await appendFile(summaryPath, `${text}\n`);
}

main();
