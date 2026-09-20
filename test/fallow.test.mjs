import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const CLI = path.join(ROOT, "bin", "hygieneFallow.mjs");
const EXIT_USAGE = 2;
const outputOf = (result) => `${result.stdout}\n${result.stderr}`;

test("the shared Fallow profile has no warning severities", async () => {
  const contents = await readFile(path.join(ROOT, "fallow.config.json"), "utf8");
  const architectureContents = await readFile(
    path.join(ROOT, "fallow.react-architecture.config.json"),
    "utf8",
  );
  const config = JSON.parse(contents);
  const architectureConfig = JSON.parse(architectureContents);

  assert.equal(config.minimumVersion, "3.27.0");
  assert.equal(config.typeAware.require, "complete");
  assert.equal(config.duplicates.mode, "semantic");
  assert.equal(config.boundaries.coverage.requireAllFiles, true);
  assert.equal(config.health.suggestInlineSuppression, false);
  assert.deepEqual(new Set(Object.values(config.rules)), new Set(["error", "off"]));
  assert.deepEqual(architectureConfig.extends, ["./fallow.config.json"]);
  assert.ok(architectureConfig.boundaries.zones.some(({ name }) => name === "domain"));
  assert.ok(architectureConfig.boundaries.calls.forbidden.some(({ from }) => from === "ui"));
});

test("the strict runner rejects an invalid health floor before analysis", () => {
  const result = spawnSync(process.execPath, [CLI, "check", "--min-score", "101"], {
    cwd: ROOT,
    encoding: "utf8",
  });

  assert.equal(result.status, EXIT_USAGE, outputOf(result));
  assert.match(result.stderr, /0 through 100/u);
});

test("the fix runner requires the project's validation command", () => {
  const result = spawnSync(process.execPath, [CLI, "fix"], {
    cwd: ROOT,
    encoding: "utf8",
  });

  assert.equal(result.status, EXIT_USAGE, outputOf(result));
  assert.match(result.stderr, /requires a validation command/u);
});
