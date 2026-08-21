import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

import baseConfig, {
  capabilityArchitecture,
  libraryConfig,
  nodeConfig,
} from "../oxlint.config.mjs";

const ROOT = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const OXLINT = path.join(ROOT, "node_modules", ".bin", "oxlint");
const TSC = path.join(ROOT, "node_modules", ".bin", "tsc");
const DIRECT_EFFECT_DIAGNOSTIC_COUNT = 3;
const AMBIENT_CAPABILITY_DIAGNOSTIC_COUNT = 5;
const TSCONFIGS = [
  "tsconfig.base.json",
  "tsconfig.json",
  "tsconfig.library.json",
  "tsconfig.node.json",
];

const runOxlint = (...args) =>
  spawnSync(OXLINT, args, {
    cwd: ROOT,
    encoding: "utf8",
  });

const outputOf = (result) => `${result.stdout}\n${result.stderr}`;

test("runtime presets do not leak browser and Node globals into each other", () => {
  assert.equal(baseConfig.env.browser, true);
  assert.equal(baseConfig.env.node, undefined);
  assert.equal(nodeConfig.env.browser, undefined);
  assert.equal(nodeConfig.env.node, true);
  assert.equal(capabilityArchitecture.options.typeCheck, true);
  assert.equal(libraryConfig.options.typeCheck, true);
});

test("the published config loads with every plugin and rule", () => {
  const result = runOxlint("--config", "oxlint.config.mjs", "--print-config");

  assert.equal(result.status, 0, outputOf(result));
});

for (const tsconfig of TSCONFIGS) {
  test(`${tsconfig} is accepted by the supported compiler`, () => {
    const result = spawnSync(TSC, ["--showConfig", "-p", tsconfig], {
      cwd: ROOT,
      encoding: "utf8",
    });

    assert.equal(result.status, 0, outputOf(result));
  });
}

test("as const does not require a justification", () => {
  const result = runOxlint(
    "--config",
    "oxlint.config.mjs",
    "--tsconfig",
    "tsconfig.json",
    "test/fixtures/validAssertion.ts",
  );

  assert.equal(result.status, 0, outputOf(result));
});

test("ordinary type assertions require a local justification", () => {
  const result = runOxlint(
    "--config",
    "oxlint.config.mjs",
    "--tsconfig",
    "tsconfig.json",
    "--format",
    "json",
    "test/fixtures/invalidAssertion.ts",
  );

  assert.notEqual(result.status, 0, outputOf(result));
  assert.match(outputOf(result), /hygiene\(require-type-assertion-justification\)/u);
});

test("the opt-in preset rejects direct React effect hooks but ignores shadowed names", () => {
  const result = runOxlint(
    "--config",
    "test/noDirectEffects.config.mjs",
    "--tsconfig",
    "tsconfig.json",
    "--format",
    "json",
    "test/fixtures/invalidUseEffect.tsx",
  );

  assert.notEqual(result.status, 0, outputOf(result));
  assert.equal(
    outputOf(result).match(/hygiene\(no-direct-effects\)/gu)?.length,
    DIRECT_EFFECT_DIAGNOSTIC_COUNT,
  );
});

test("the opt-in preset resolves React imports regardless of source order", () => {
  const result = runOxlint(
    "--config",
    "test/noDirectEffects.config.mjs",
    "--tsconfig",
    "tsconfig.json",
    "--format",
    "json",
    "test/fixtures/invalidLateUseEffect.tsx",
  );

  assert.notEqual(result.status, 0, outputOf(result));
  assert.equal(outputOf(result).match(/hygiene\(no-direct-effects\)/gu)?.length, 1);
});

test("capability boundaries reject direct effects and ambient UI capabilities", () => {
  const result = runOxlint(
    "--config",
    "test/capabilityArchitecture.config.mjs",
    "--tsconfig",
    "tsconfig.json",
    "--format",
    "json",
    "test/fixtures/invalidUiCapabilities.tsx",
  );
  const output = outputOf(result);

  assert.notEqual(result.status, 0, output);
  assert.match(output, /hygiene\(no-direct-effects\)/u);
  assert.equal(
    output.match(/hygiene\(no-ambient-capabilities\)/gu)?.length,
    AMBIENT_CAPABILITY_DIAGNOSTIC_COUNT,
  );
  assert.match(output, /eslint\(no-restricted-properties\)/u);
});

test("capability boundaries ignore shadowed global-object names", () => {
  const result = runOxlint(
    "--config",
    "test/capabilityArchitecture.config.mjs",
    "--tsconfig",
    "tsconfig.json",
    "--format",
    "json",
    "test/fixtures/validShadowedCapabilities.ts",
  );

  assert.doesNotMatch(outputOf(result), /hygiene\(no-ambient-capabilities\)/u);
});

test("capability boundaries keep React out of the domain layer", () => {
  const result = runOxlint(
    "--config",
    "test/capabilityArchitecture.config.mjs",
    "--tsconfig",
    "tsconfig.json",
    "--format",
    "json",
    "test/fixtures/invalidDomain.ts",
  );
  const output = outputOf(result);

  assert.notEqual(result.status, 0, output);
  assert.match(output, /eslint\(no-restricted-imports\)/u);
});

test("declared effect boundaries may synchronize with external systems", () => {
  const result = runOxlint(
    "--config",
    "test/capabilityArchitecture.config.mjs",
    "--print-config",
    "test/fixtures/validEffectBoundary.tsx",
  );

  assert.equal(result.status, 0, outputOf(result));
  assert.equal(JSON.parse(result.stdout).rules["hygiene/no-direct-effects"], undefined);
});
