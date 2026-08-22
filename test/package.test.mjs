import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const CONSUMER_TEST_TIMEOUT = 120_000;
const JSON_INDENT = 2;
const NPM = process.platform === "win32" ? "npm.cmd" : "npm";
const OXLINT = process.platform === "win32" ? "oxlint.cmd" : "oxlint";

const outputOf = (result) => `${result.stdout}\n${result.stderr}`;

test(
  "the packed artifact installs and lints a clean consumer",
  { timeout: CONSUMER_TEST_TIMEOUT },
  async () => {
    const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "hygiene-consumer-"));
    const npmCache = path.join(temporaryDirectory, "npm-cache");

    try {
      const packResult = spawnSync(
        NPM,
        ["pack", "--json", "--pack-destination", temporaryDirectory, "--cache", npmCache],
        {
          cwd: ROOT,
          encoding: "utf8",
        },
      );

      assert.equal(packResult.status, 0, outputOf(packResult));

      const [{ filename }] = JSON.parse(packResult.stdout);
      const tarball = path.join(temporaryDirectory, filename);

      await writeFile(
        path.join(temporaryDirectory, "package.json"),
        `${JSON.stringify(
          { name: "hygiene-consumer-smoke", private: true, type: "module" },
          null,
          JSON_INDENT,
        )}\n`,
      );
      await writeFile(
        path.join(temporaryDirectory, "oxlint.config.mjs"),
        'import config from "@sergeigarin/hygene";\n\nexport default config;\n',
      );
      await writeFile(
        path.join(temporaryDirectory, "tsconfig.json"),
        `${JSON.stringify(
          { extends: "@sergeigarin/hygene/tsconfig.json", include: ["source.ts"] },
          null,
          JSON_INDENT,
        )}\n`,
      );
      await writeFile(
        path.join(temporaryDirectory, "source.ts"),
        "export const identity = <Value>(value: Value): Value => value;\n",
      );

      const installResult = spawnSync(
        NPM,
        [
          "install",
          "--ignore-scripts",
          "--no-audit",
          "--no-fund",
          "--package-lock=false",
          "--cache",
          npmCache,
          tarball,
        ],
        {
          cwd: temporaryDirectory,
          encoding: "utf8",
        },
      );

      assert.equal(installResult.status, 0, outputOf(installResult));

      const importResult = spawnSync(
        process.execPath,
        [
          "--input-type=module",
          "--eval",
          'import config, { capabilityArchitecture } from "@sergeigarin/hygene"; if (!config.rules || !capabilityArchitecture.rules) process.exitCode = 1;',
        ],
        {
          cwd: temporaryDirectory,
          encoding: "utf8",
        },
      );

      assert.equal(importResult.status, 0, outputOf(importResult));

      const lintResult = spawnSync(
        path.join(temporaryDirectory, "node_modules", ".bin", OXLINT),
        [
          "--config",
          "oxlint.config.mjs",
          "--tsconfig",
          "tsconfig.json",
          "--deny-warnings",
          "source.ts",
        ],
        {
          cwd: temporaryDirectory,
          encoding: "utf8",
        },
      );

      assert.equal(lintResult.status, 0, outputOf(lintResult));
    } finally {
      await rm(temporaryDirectory, { force: true, recursive: true });
    }
  },
);
