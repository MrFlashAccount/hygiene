import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
const FALLOW = process.platform === "win32" ? "fallow.cmd" : "fallow";
const HYGIENE_FALLOW = process.platform === "win32" ? "hygiene-fallow.cmd" : "hygiene-fallow";

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
          { extends: "@sergeigarin/hygene/tsconfig.json", include: ["src"] },
          null,
          JSON_INDENT,
        )}\n`,
      );
      await writeFile(
        path.join(temporaryDirectory, ".fallowrc.json"),
        `${JSON.stringify(
          {
            $schema: "./node_modules/fallow/schema.json",
            entry: ["src/app/main.ts", "oxlint.config.mjs"],
            extends: ["npm:@sergeigarin/hygene/fallow.config.json"],
            typeAware: { projects: ["tsconfig.json"] },
          },
          null,
          JSON_INDENT,
        )}\n`,
      );
      await mkdir(path.join(temporaryDirectory, "src", "app"), { recursive: true });
      await mkdir(path.join(temporaryDirectory, "src", "shared"), { recursive: true });
      await writeFile(
        path.join(temporaryDirectory, "src", "app", "main.ts"),
        'import { usedValue } from "../shared/value.js";\n\nexport const value = usedValue;\n',
      );
      await writeFile(
        path.join(temporaryDirectory, "src", "shared", "value.ts"),
        'export const usedValue = "used";\nexport const removedValue = "removed";\n',
      );

      const installResult = spawnSync(
        NPM,
        [
          "install",
          "--save-dev",
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

      const agentTemplate = await readFile(
        path.join(
          temporaryDirectory,
          "node_modules",
          "@sergeigarin",
          "hygene",
          "templates",
          "AGENTS.md",
        ),
        "utf8",
      );

      assert.match(agentTemplate, /^# Project agent instructions$/mu);
      assert.match(agentTemplate, /^## Capability architecture$/mu);

      const fallowConfigResult = spawnSync(
        path.join(temporaryDirectory, "node_modules", ".bin", FALLOW),
        ["config", "--format", "json", "--quiet"],
        {
          cwd: temporaryDirectory,
          encoding: "utf8",
        },
      );

      assert.equal(fallowConfigResult.status, 0, outputOf(fallowConfigResult));

      const fallowConfig = JSON.parse(fallowConfigResult.stdout);

      assert.equal(fallowConfig.duplicates.mode, "semantic");
      assert.equal(fallowConfig.boundaries.coverage.requireAllFiles, true);
      assert.deepEqual(new Set(Object.values(fallowConfig.rules)), new Set(["error", "off"]));

      const architectureConfigResult = spawnSync(
        path.join(temporaryDirectory, "node_modules", ".bin", FALLOW),
        [
          "config",
          "--config",
          "node_modules/@sergeigarin/hygene/fallow.react-architecture.config.json",
          "--format",
          "json",
          "--quiet",
        ],
        {
          cwd: temporaryDirectory,
          encoding: "utf8",
        },
      );

      assert.equal(architectureConfigResult.status, 0, outputOf(architectureConfigResult));
      assert.ok(
        JSON.parse(architectureConfigResult.stdout).boundaries.zones.some(
          ({ name }) => name === "domain",
        ),
      );

      const fixResult = spawnSync(
        path.join(temporaryDirectory, "node_modules", ".bin", HYGIENE_FALLOW),
        [
          "fix",
          "--",
          process.execPath,
          "--input-type=module",
          "--eval",
          'import { readFileSync } from "node:fs"; const source = readFileSync("src/shared/value.ts", "utf8"); if (source.includes("export const removedValue")) process.exit(1);',
        ],
        {
          cwd: temporaryDirectory,
          encoding: "utf8",
        },
      );

      assert.equal(fixResult.status, 0, outputOf(fixResult));
      const fixedSourcePath = path.join(temporaryDirectory, "src", "shared", "value.ts");
      const fixedSource = await readFile(fixedSourcePath, "utf8");

      assert.doesNotMatch(fixedSource, /export const removedValue/u);
      await writeFile(
        fixedSourcePath,
        fixedSource.replace('const removedValue = "removed";\n', ""),
      );

      const fallowResult = spawnSync(
        path.join(temporaryDirectory, "node_modules", ".bin", HYGIENE_FALLOW),
        ["check"],
        {
          cwd: temporaryDirectory,
          encoding: "utf8",
        },
      );

      assert.equal(fallowResult.status, 0, outputOf(fallowResult));

      const lintResult = spawnSync(
        path.join(temporaryDirectory, "node_modules", ".bin", OXLINT),
        [
          "--config",
          "oxlint.config.mjs",
          "--tsconfig",
          "tsconfig.json",
          "--deny-warnings",
          "src/app/main.ts",
          "src/shared/value.ts",
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
