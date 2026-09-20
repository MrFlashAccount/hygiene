#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";

const DEFAULT_MINIMUM_SCORE = 85;
const MAXIMUM_SCORE = 100;
const EXIT_USAGE = 2;
const JSON_INDENT = 2;
const CLI_ARGUMENT_OFFSET = 2;
const require = createRequire(import.meta.url);
const fallowBinary = require.resolve("fallow/bin/fallow");

const usage = `Usage:
  hygiene-fallow check [--min-score <0-100>]
  hygiene-fallow fix -- <validation command> [arguments...]

HYGIENE_FALLOW_MIN_SCORE overrides the default health-score floor of 85.`;

const failUsage = (message) => {
  process.stderr.write(`${message}\n\n${usage}\n`);
  process.exitCode = EXIT_USAGE;
};

const runFallow = (label, arguments_) => {
  process.stdout.write(`\n[hygiene] ${label}\n`);

  // fallow-ignore-next-line security-sink -- The executable is resolved from the pinned Fallow package and spawnSync does not invoke a shell.
  const result = spawnSync(fallowBinary, arguments_, {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);

  if (result.stderr !== "") {
    return result.status === 0 ? 1 : (result.status ?? EXIT_USAGE);
  }

  return result.status ?? EXIT_USAGE;
};

const parseReport = (result) => {
  try {
    return JSON.parse(result.stdout);
  } catch {
    process.stderr.write(`${result.stdout}${result.stderr}`);
    process.stderr.write("[hygiene] Fallow did not return valid JSON.\n");
    return null;
  }
};

const hasFailedGate = (report) =>
  Object.values(report.gate_outcomes ?? {}).some(
    (outcome) => outcome.enforced === true && outcome.status === "fail",
  );

const hasDiagnostics = (report) => (report.workspace_diagnostics ?? []).length > 0;

const reportFailure = (result, report) => {
  process.stderr.write(`${JSON.stringify(report, null, JSON_INDENT)}\n${result.stderr}`);
  return result.status === 0 ? 1 : (result.status ?? EXIT_USAGE);
};

const analysisFailed = (result, report) =>
  (result.status ?? EXIT_USAGE) !== 0 ||
  result.stderr !== "" ||
  hasFailedGate(report) ||
  hasDiagnostics(report);

const runFallowJson = (label, arguments_) => {
  process.stdout.write(`\n[hygiene] ${label}\n`);

  // fallow-ignore-next-line security-sink -- The executable is resolved from the pinned Fallow package and spawnSync does not invoke a shell.
  const result = spawnSync(
    fallowBinary,
    [...arguments_, "--format", "json", "--quiet", "--no-cache"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );

  if (result.error) {
    throw result.error;
  }

  const report = parseReport(result);

  if (report === null) {
    return result.status ?? EXIT_USAGE;
  }

  if (analysisFailed(result, report)) {
    return reportFailure(result, report);
  }

  process.stdout.write(`[hygiene] ${label}: passed\n`);
  return 0;
};

const scoreOption = (arguments_) => {
  const optionIndex = arguments_.indexOf("--min-score");

  if (optionIndex === -1) {
    return {
      remainingArguments: arguments_,
      value: process.env.HYGIENE_FALLOW_MIN_SCORE ?? String(DEFAULT_MINIMUM_SCORE),
    };
  }

  return {
    remainingArguments: arguments_.filter(
      (_, index) => index !== optionIndex && index !== optionIndex + 1,
    ),
    value: arguments_[optionIndex + 1],
  };
};

const isValidScore = (value) => {
  const score = Number(value);
  return value !== undefined && Number.isFinite(score) && score >= 0 && score <= MAXIMUM_SCORE;
};

const verifyStrictConfig = () => {
  // fallow-ignore-next-line security-sink -- The executable is resolved from the pinned Fallow package and spawnSync does not invoke a shell.
  const result = spawnSync(fallowBinary, ["config", "--format", "json", "--quiet"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0 || result.stderr !== "") {
    process.stderr.write(`${result.stdout}${result.stderr}`);
    return false;
  }

  const config = JSON.parse(result.stdout);
  const warningRules = Object.entries(config.rules ?? {})
    .filter(([, severity]) => severity === "warn" || severity === "warning")
    .map(([rule]) => rule);

  if (warningRules.length === 0) {
    return true;
  }

  process.stderr.write(
    `[hygiene] Warning severities are forbidden. Set these rules to error or off: ${warningRules.join(
      ", ",
    )}\n`,
  );
  return false;
};

const readMinimumScore = (arguments_) => {
  const { remainingArguments, value } = scoreOption(arguments_);

  if (remainingArguments.length > 0 || !isValidScore(value)) {
    return null;
  }

  return Number(value);
};

const check = (arguments_) => {
  const minimumScore = readMinimumScore(arguments_);

  if (minimumScore === null) {
    failUsage("check accepts only --min-score with a value from 0 through 100.");
    return;
  }

  if (!verifyStrictConfig()) {
    process.exitCode = 1;
    return;
  }

  const checks = [
    [
      "type-aware dead code and architecture",
      ["dead-code", "--fail-on-issues", "--type-aware", "--type-aware-require", "complete"],
    ],
    ["semantic duplication", ["dupes", "--fail-on-issues"]],
    ["complexity and CRAP thresholds", ["health", "--complexity", "--fail-on-issues"]],
    ["health score", ["health", "--score", "--min-score", String(minimumScore)]],
    ["security candidates", ["security", "--fail-on-issues"]],
  ];

  for (const [label, fallowArguments] of checks) {
    const status = runFallowJson(label, fallowArguments);

    if (status !== 0) {
      process.exitCode = status;
      return;
    }
  }
};

const fix = (arguments_) => {
  const separatorIndex = arguments_.indexOf("--");
  const validationCommand = arguments_.slice(separatorIndex + 1);

  if (separatorIndex !== 0 || validationCommand.length === 0) {
    failUsage("fix requires a validation command after --.");
    return;
  }

  if (!verifyStrictConfig()) {
    process.exitCode = 1;
    return;
  }

  const fixStatus = runFallow("safe dead-code fixes", [
    "fix",
    "--yes",
    "--no-create-config",
    "--type-aware",
    "--type-aware-require",
    "complete",
    "--no-cache",
    "--format",
    "json",
    "--quiet",
    "--pretty",
  ]);

  process.stdout.write("\n[hygiene] project validation\n");

  // fallow-ignore-next-line security-sink -- The caller deliberately supplies executable argv after `--`; spawnSync does not invoke a shell.
  const validationResult = spawnSync(validationCommand[0], validationCommand.slice(1), {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  if (validationResult.error) {
    throw validationResult.error;
  }

  process.exitCode = fixStatus === 0 ? (validationResult.status ?? EXIT_USAGE) : fixStatus;
};

const [command = "check", ...arguments_] = process.argv.slice(CLI_ARGUMENT_OFFSET);

if (command === "check") {
  check(arguments_);
} else if (command === "fix") {
  fix(arguments_);
} else {
  failUsage(`Unknown command: ${command}`);
}
