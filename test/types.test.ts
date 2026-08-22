import type { OxlintConfig } from "oxlint";

import baseConfig, {
  capabilityArchitecture,
  defineHygieneConfig,
  libraryConfig,
  noDirectEffects,
  nodeConfig,
} from "@sergeigarin/hygene";
import hygienePlugin from "@sergeigarin/hygene/hygienePlugin.mjs";

const exportedConfigs: readonly OxlintConfig[] = [
  baseConfig,
  capabilityArchitecture,
  libraryConfig,
  noDirectEffects,
  nodeConfig,
];

const customConfig = defineHygieneConfig({
  architecture: {
    domainForbiddenImportPatterns: ["**/adapters/**", "**/ui/**"],
    domainFiles: ["src/domain/**/*.ts"],
    effectBoundaryFiles: ["src/platform/effects/**"],
    uiForbiddenImportPatterns: ["**/adapters/**"],
    uiFiles: ["src/ui/**/*.tsx"],
  },
  banDirectEffects: true,
  environment: "browser",
  typeCheck: true,
});

export const typeContract = {
  customConfig,
  exportedConfigs,
  hygienePlugin,
} as const;
