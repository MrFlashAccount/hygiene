import { defineHygieneConfig } from "../oxlint.config.mjs";

export default defineHygieneConfig({
  architecture: {
    domainFiles: ["fixtures/invalidDomain.ts"],
    effectBoundaryFiles: ["fixtures/validEffectBoundary.tsx"],
    uiFiles: ["fixtures/invalidUiCapabilities.tsx", "fixtures/validShadowedCapabilities.ts"],
  },
  banDirectEffects: true,
});
