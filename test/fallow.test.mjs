import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolveValidationCommand } from "../bin/validationCommand.mjs";
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

  assert.equal(config.minimumVersion, "3.38.1");
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

test("Windows npm validation runs through Node with literal arguments", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "hygiene npm "));

  try {
    const cliDirectory = path.join(directory, "node_modules", "npm", "bin");
    await mkdir(cliDirectory, { recursive: true });
    await writeFile(path.join(directory, "npm.cmd"), "@echo off\n");
    const cli = path.join(cliDirectory, "npm-cli.js");
    await writeFile(cli, "process.stdout.write(JSON.stringify(process.argv.slice(2)))");
    const arguments_ = ["run", "validate", "--", "space and & metacharacters", '"quoted"'];
    const invocation = resolveValidationCommand(["npm", ...arguments_], "win32", directory);
    const result = spawnSync(invocation.file, invocation.arguments, { encoding: "utf8" });

    assert.equal(result.status, 0, outputOf(result));
    assert.deepEqual(JSON.parse(result.stdout), arguments_);
    assert.deepEqual(
      resolveValidationCommand(["npm.cmd", ...arguments_], "win32", directory),
      invocation,
    );
    assert.throws(
      () => resolveValidationCommand(["npx", "test"], "win32", directory),
      /Cannot resolve/u,
    );
    assert.deepEqual(resolveValidationCommand(["npm", "test"], "linux", directory), {
      arguments: ["test"],
      file: "npm",
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
