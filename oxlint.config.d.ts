import type { OxlintConfig } from "oxlint";

export interface CapabilityArchitectureOptions {
  readonly domainForbiddenImportPatterns?: readonly string[];
  readonly domainFiles?: readonly string[];
  readonly effectBoundaryFiles?: readonly string[];
  readonly uiForbiddenImportPatterns?: readonly string[];
  readonly uiFiles?: readonly string[];
}

export interface HygieneConfigOptions {
  readonly architecture?: CapabilityArchitectureOptions;
  readonly banDirectEffects?: boolean;
  readonly environment?: "browser" | "node" | "universal";
  readonly typeCheck?: boolean;
}

/** Creates a runtime-specific strict config with optional capability boundaries. */
export declare const defineHygieneConfig: (options?: HygieneConfigOptions) => OxlintConfig;

/** Opt-in preset that also forbids direct React effect hooks. */
export declare const noDirectEffects: OxlintConfig;

/** Strict preset for Node.js source files without browser globals. */
export declare const nodeConfig: OxlintConfig;

/** Strict preset for publishable libraries, including compiler diagnostics. */
export declare const libraryConfig: OxlintConfig;

/** Opinionated architecture preset with explicit effects, I/O, storage, time, and import boundaries. */
export declare const capabilityArchitecture: OxlintConfig;

/** Strict shared Oxlint baseline for modern React and TypeScript projects. */
declare const baseConfig: OxlintConfig;

export default baseConfig;
