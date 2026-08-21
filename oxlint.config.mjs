import { RECOMMENDED_RULES } from "oxlint-plugin-react-doctor";

const MAX_COMPLEXITY = 8;
const MAX_FUNCTION_PARAMS = 3;
const MAX_NESTING_DEPTH = 3;
const MAX_NESTED_DESCRIBE = 2;
const SOURCE_FILES = [
  "**/*.js",
  "**/*.jsx",
  "**/*.mjs",
  "**/*.cjs",
  "**/*.ts",
  "**/*.tsx",
  "**/*.mts",
  "**/*.cts",
];
const TYPESCRIPT_FILES = ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"];
const TEST_FILES = [
  "**/*.test.js",
  "**/*.test.jsx",
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/*.spec.js",
  "**/*.spec.jsx",
  "**/*.spec.ts",
  "**/*.spec.tsx",
];
const NO_MAGIC_NUMBERS_OPTIONS = {
  detectObjects: true,
  enforceConst: true,
  ignore: [-1, 0, 1],
  ignoreArrayIndexes: false,
  ignoreClassFieldInitialValues: false,
  ignoreDefaultValues: false,
  ignoreEnums: false,
  ignoreNumericLiteralTypes: false,
  ignoreReadonlyClassProperties: false,
  ignoreTypeIndexes: false,
};
const REACT_DOCTOR_DUPLICATES = new Set([
  "react-doctor/exhaustive-deps",
  "react-doctor/rules-of-hooks",
]);
const BASE_RESTRICTED_IMPORTS = {
  paths: [{ message: "Use lodash-es so bundlers can tree-shake the import.", name: "lodash" }],
  patterns: [
    {
      group: ["lodash/*"],
      message: "Use lodash-es so bundlers can tree-shake the import.",
    },
  ],
};
const DEFAULT_DOMAIN_IMPORT_PATTERNS = [
  "**/components/**",
  "**/features/**",
  "**/pages/**",
  "**/infrastructure/**",
];
const DEFAULT_UI_IMPORT_PATTERNS = ["**/infrastructure/**", "**/server/**"];
const UI_RESTRICTED_GLOBALS = [
  { message: "Inject an HTTP capability instead of calling fetch from UI code.", name: "fetch" },
  {
    message: "Inject a storage capability instead of reading IndexedDB from UI code.",
    name: "indexedDB",
  },
  {
    message: "Inject a storage capability instead of reading localStorage from UI code.",
    name: "localStorage",
  },
  {
    message: "Inject a storage capability instead of reading sessionStorage from UI code.",
    name: "sessionStorage",
  },
  {
    message: "Inject a transport capability instead of opening EventSource from UI code.",
    name: "EventSource",
  },
  {
    message: "Inject a transport capability instead of opening WebSocket from UI code.",
    name: "WebSocket",
  },
];
const UI_RESTRICTED_PROPERTIES = [
  {
    message: "Inject a clock capability instead of reading wall-clock time from UI code.",
    object: "Date",
    property: "now",
  },
  {
    message: "Inject a random capability instead of using ambient randomness from UI code.",
    object: "Math",
    property: "random",
  },
];
const DEFAULT_CAPABILITY_ARCHITECTURE = {
  domainFiles: ["src/domain/**/*.ts", "src/domain/**/*.tsx"],
  effectBoundaryFiles: ["src/infrastructure/react/**", "src/platform/effects/**"],
  uiFiles: [
    "src/components/**/*.ts",
    "src/components/**/*.tsx",
    "src/features/**/*.ts",
    "src/features/**/*.tsx",
    "src/pages/**/*.ts",
    "src/pages/**/*.tsx",
  ],
};
const reactDoctorRules = Object.fromEntries(
  Object.keys(RECOMMENDED_RULES).flatMap((ruleName) =>
    REACT_DOCTOR_DUPLICATES.has(ruleName) ? [] : [[ruleName, "error"]],
  ),
);

const baseConfig = {
  categories: {
    correctness: "off",
  },
  env: {
    browser: true,
    builtin: true,
    es2024: true,
  },
  jsPlugins: [
    "@sergeigarin/hygene/hygienePlugin.mjs",
    "@nkzw/eslint-plugin",
    "eslint-plugin-perfectionist",
    "eslint-plugin-unused-imports",
    { name: "react-doctor", specifier: "oxlint-plugin-react-doctor" },
    { name: "react-hooks-js", specifier: "eslint-plugin-react-hooks" },
  ],
  options: {
    typeAware: true,
  },
  overrides: [
    {
      files: TYPESCRIPT_FILES,
      rules: {
        "constructor-super": "off",
        "getter-return": "off",
        "no-class-assign": "off",
        "no-const-assign": "off",
        "no-dupe-class-members": "off",
        "no-dupe-keys": "off",
        "no-func-assign": "off",
        "no-import-assign": "off",
        "no-new-native-nonconstructor": "off",
        "no-obj-calls": "off",
        "no-redeclare": "off",
        "no-setter-return": "off",
        "no-this-before-super": "off",
        "no-undef": "off",
        "no-unreachable": "off",
        "no-unsafe-negation": "off",
        "no-with": "off",
        "require-await": "off",
        "typescript/adjacent-overload-signatures": "error",
        "typescript/await-thenable": "error",
        "typescript/ban-ts-comment": [
          "error",
          {
            "ts-check": false,
            "ts-expect-error": true,
            "ts-ignore": true,
            "ts-nocheck": true,
          },
        ],
        "typescript/consistent-generic-constructors": "error",
        "typescript/consistent-indexed-object-style": "error",
        "typescript/consistent-return": "error",
        "typescript/consistent-type-assertions": "error",
        "typescript/consistent-type-exports": "error",
        "typescript/consistent-type-imports": [
          "error",
          {
            fixStyle: "separate-type-imports",
            prefer: "type-imports",
          },
        ],
        "typescript/dot-notation": "error",
        "typescript/explicit-module-boundary-types": "error",
        "typescript/method-signature-style": "error",
        "typescript/no-array-delete": "error",
        "typescript/no-base-to-string": "error",
        "typescript/no-confusing-non-null-assertion": "error",
        "typescript/no-confusing-void-expression": "error",
        "typescript/no-deprecated": "error",
        "typescript/no-duplicate-enum-values": "error",
        "typescript/no-duplicate-type-constituents": "error",
        "typescript/no-dynamic-delete": "error",
        "typescript/no-empty-object-type": "error",
        "typescript/no-explicit-any": "error",
        "typescript/no-extra-non-null-assertion": "error",
        "typescript/no-extraneous-class": "error",
        "typescript/no-floating-promises": ["error", { ignoreIIFE: false, ignoreVoid: false }],
        "typescript/no-for-in-array": "error",
        "typescript/no-implied-eval": "error",
        "typescript/no-import-type-side-effects": "error",
        "typescript/no-invalid-void-type": "error",
        "typescript/no-meaningless-void-operator": "error",
        "typescript/no-misused-new": "error",
        "typescript/no-misused-promises": [
          "error",
          {
            checksConditionals: true,
            checksSpreads: true,
            checksVoidReturn: true,
          },
        ],
        "typescript/no-misused-spread": "error",
        "typescript/no-mixed-enums": "error",
        "typescript/no-namespace": "error",
        "typescript/no-non-null-asserted-nullish-coalescing": "error",
        "typescript/no-non-null-asserted-optional-chain": "error",
        "typescript/no-non-null-assertion": "error",
        "typescript/no-redundant-type-constituents": "error",
        "typescript/no-require-imports": "error",
        "typescript/no-restricted-types": [
          "error",
          {
            types: {
              object: {
                message:
                  "The object type hides the value shape. Use a concrete interface or Readonly<Record<string, unknown>>.",
                suggest: ["Readonly<Record<string, unknown>>"],
              },
            },
          },
        ],
        "typescript/no-this-alias": "error",
        "typescript/no-unnecessary-boolean-literal-compare": "error",
        "typescript/no-unnecessary-condition": "error",
        "typescript/no-unnecessary-parameter-property-assignment": "error",
        "typescript/no-unnecessary-qualifier": "error",
        "typescript/no-unnecessary-template-expression": "error",
        "typescript/no-unnecessary-type-arguments": "error",
        "typescript/no-unnecessary-type-assertion": "error",
        "typescript/no-unnecessary-type-constraint": "error",
        "typescript/no-unnecessary-type-conversion": "error",
        "typescript/no-unnecessary-type-parameters": "error",
        "typescript/no-unsafe-argument": "error",
        "typescript/no-unsafe-assignment": "error",
        "typescript/no-unsafe-call": "error",
        "typescript/no-unsafe-declaration-merging": "error",
        "typescript/no-unsafe-enum-comparison": "error",
        "typescript/no-unsafe-function-type": "error",
        "typescript/no-unsafe-member-access": "error",
        "typescript/no-unsafe-return": "error",
        "typescript/no-unsafe-type-assertion": "error",
        "typescript/no-unsafe-unary-minus": "error",
        "typescript/no-useless-default-assignment": "error",
        "typescript/no-useless-empty-export": "error",
        "typescript/no-wrapper-object-types": "error",
        "typescript/only-throw-error": "error",
        "typescript/prefer-as-const": "error",
        "typescript/prefer-find": "error",
        "typescript/prefer-for-of": "error",
        "typescript/prefer-function-type": "error",
        "typescript/prefer-includes": "error",
        "typescript/prefer-literal-enum-member": "error",
        "typescript/prefer-namespace-keyword": "error",
        "typescript/prefer-nullish-coalescing": "error",
        "typescript/prefer-promise-reject-errors": "error",
        "typescript/prefer-readonly": "error",
        "typescript/prefer-reduce-type-parameter": "error",
        "typescript/prefer-regexp-exec": "error",
        "typescript/prefer-return-this-type": "error",
        "typescript/prefer-string-starts-ends-with": "error",
        "typescript/promise-function-async": "error",
        "typescript/related-getter-setter-pairs": "error",
        "typescript/require-array-sort-compare": ["error", { ignoreStringArrays: true }],
        "typescript/require-await": "error",
        "typescript/restrict-plus-operands": [
          "error",
          {
            allowAny: false,
            allowBoolean: false,
            allowNullish: false,
            allowNumberAndString: false,
            allowRegExp: false,
            skipCompoundAssignments: false,
          },
        ],
        "typescript/restrict-template-expressions": [
          "error",
          {
            allowAny: false,
            allowArray: false,
            allowBoolean: false,
            allowNever: false,
            allowNullish: false,
            allowNumber: false,
            allowRegExp: false,
          },
        ],
        "typescript/return-await": ["error", "in-try-catch"],
        "typescript/strict-boolean-expressions": [
          "error",
          {
            allowAny: false,
            allowNullableBoolean: false,
            allowNullableEnum: false,
            allowNullableNumber: false,
            allowNullableObject: false,
            allowNullableString: false,
            allowNumber: false,
            allowString: false,
          },
        ],
        "typescript/strict-void-return": "error",
        "typescript/switch-exhaustiveness-check": "error",
        "typescript/triple-slash-reference": "error",
        "typescript/unbound-method": "error",
        "typescript/unified-signatures": "error",
        "typescript/use-unknown-in-catch-callback-variable": "error",
      },
    },
    {
      env: {
        node: true,
      },
      files: TEST_FILES,
      rules: {
        "vitest/expect-expect": "error",
        "vitest/max-nested-describe": ["error", { max: MAX_NESTED_DESCRIBE }],
        "vitest/no-commented-out-tests": "error",
        "vitest/no-conditional-expect": "error",
        "vitest/no-conditional-tests": "error",
        "vitest/no-disabled-tests": "error",
        "vitest/no-duplicate-hooks": "error",
        "vitest/no-focused-tests": "error",
        "vitest/no-identical-title": "error",
        "vitest/no-import-node-test": "error",
        "vitest/no-interpolation-in-snapshots": "error",
        "vitest/no-mocks-import": "error",
        "vitest/no-standalone-expect": "error",
        "vitest/no-test-return-statement": "error",
        "vitest/no-unneeded-async-expect-function": "error",
        "vitest/prefer-called-exactly-once-with": "error",
        "vitest/prefer-hooks-in-order": "error",
        "vitest/prefer-hooks-on-top": "error",
        "vitest/prefer-importing-vitest-globals": "error",
        "vitest/prefer-strict-equal": "error",
        "vitest/require-awaited-expect-poll": "error",
        "vitest/require-local-test-context-for-concurrent-snapshots": "error",
        "vitest/require-to-throw-message": "error",
        "vitest/valid-describe-callback": "error",
        "vitest/valid-expect": "error",
        "vitest/valid-expect-in-promise": "error",
        "vitest/valid-title": "error",
      },
    },
  ],
  plugins: ["typescript", "import", "oxc", "promise", "react", "unicorn", "vitest"],
  rules: {
    "@nkzw/ensure-relay-types": "error",
    "@nkzw/no-instanceof": "error",
    "@nkzw/require-use-effect-arguments": "error",
    ...reactDoctorRules,
    "array-callback-return": "error",
    "arrow-body-style": ["error", "as-needed"],
    complexity: ["error", { max: MAX_COMPLEXITY, variant: "modified" }],
    "constructor-super": "error",
    curly: "error",
    "default-case-last": "error",
    "default-param-last": "error",
    eqeqeq: "error",
    "for-direction": "error",
    "getter-return": "error",
    "guard-for-in": "error",
    "hygiene/require-type-assertion-justification": "error",
    "import/export": "error",
    "import/no-absolute-path": "error",
    "import/no-commonjs": "error",
    "import/no-cycle": "error",
    "import/no-duplicates": "error",
    "import/no-mutable-exports": "error",
    "import/no-named-as-default": "error",
    "import/no-named-as-default-member": "error",
    "import/no-namespace": "error",
    "import/no-self-import": "error",
    "max-depth": ["error", { max: MAX_NESTING_DEPTH }],
    "max-params": ["error", { max: MAX_FUNCTION_PARAMS }],
    "no-array-constructor": "error",
    "no-async-promise-executor": "error",
    "no-caller": "error",
    "no-case-declarations": "error",
    "no-class-assign": "error",
    "no-compare-neg-zero": "error",
    "no-cond-assign": "error",
    "no-console": "error",
    "no-const-assign": "error",
    "no-constant-binary-expression": "error",
    "no-constant-condition": "error",
    "no-constructor-return": "error",
    "no-control-regex": "error",
    "no-debugger": "error",
    "no-delete-var": "error",
    "no-dupe-class-members": "error",
    "no-dupe-else-if": "error",
    "no-dupe-keys": "error",
    "no-duplicate-case": "error",
    "no-empty": "error",
    "no-empty-character-class": "error",
    "no-empty-pattern": "error",
    "no-empty-static-block": "error",
    "no-eval": "error",
    "no-ex-assign": "error",
    "no-extend-native": "error",
    "no-extra-boolean-cast": "error",
    "no-fallthrough": "error",
    "no-func-assign": "error",
    "no-global-assign": "error",
    "no-implied-eval": "error",
    "no-import-assign": "error",
    "no-invalid-regexp": "error",
    "no-irregular-whitespace": "error",
    "no-iterator": "error",
    "no-labels": "error",
    "no-loss-of-precision": "error",
    "no-magic-numbers": ["error", NO_MAGIC_NUMBERS_OPTIONS],
    "no-misleading-character-class": "error",
    "no-new-func": "error",
    "no-new-native-nonconstructor": "error",
    "no-new-wrappers": "error",
    "no-nonoctal-decimal-escape": "error",
    "no-obj-calls": "error",
    "no-object-constructor": "error",
    "no-param-reassign": "error",
    "no-promise-executor-return": "error",
    "no-proto": "error",
    "no-prototype-builtins": "error",
    "no-redeclare": "error",
    "no-regex-spaces": "error",
    "no-restricted-imports": ["error", BASE_RESTRICTED_IMPORTS],
    "no-return-assign": "error",
    "no-script-url": "error",
    "no-self-assign": "error",
    "no-self-compare": "error",
    "no-sequences": "error",
    "no-setter-return": "error",
    "no-shadow-restricted-names": "error",
    "no-sparse-arrays": "error",
    "no-this-before-super": "error",
    "no-throw-literal": "error",
    "no-unassigned-vars": "error",
    "no-undef": "error",
    "no-unexpected-multiline": "error",
    "no-unreachable": "error",
    "no-unsafe-finally": "error",
    "no-unsafe-negation": "error",
    "no-unsafe-optional-chaining": "error",
    "no-unused-expressions": "error",
    "no-unused-labels": "error",
    "no-unused-private-class-members": "error",
    "no-unused-vars": "error",
    "no-useless-backreference": "error",
    "no-useless-catch": "error",
    "no-useless-constructor": "error",
    "no-useless-escape": "error",
    "no-useless-rename": "error",
    "no-var": "error",
    "no-warning-comments": ["error", { terms: ["@nocommit"] }],
    "no-with": "error",
    "oxc/no-barrel-file": "error",
    "perfectionist/sort-enums": ["error", { partitionByComment: true, sortByValue: "always" }],
    "perfectionist/sort-heritage-clauses": "error",
    "perfectionist/sort-interfaces": "error",
    "perfectionist/sort-jsx-props": "error",
    "perfectionist/sort-object-types": "error",
    "perfectionist/sort-objects": ["error", { partitionByComment: true }],
    "prefer-const": "error",
    "prefer-object-has-own": "error",
    "prefer-object-spread": "error",
    "prefer-promise-reject-errors": "error",
    "prefer-rest-params": "error",
    "prefer-spread": "error",
    "preserve-caught-error": "error",
    "promise/no-multiple-resolved": "error",
    "promise/no-new-statics": "error",
    "promise/no-return-wrap": "error",
    "promise/param-names": "error",
    "promise/valid-params": "error",
    radix: "error",
    "react-hooks-js/component-hook-factories": "error",
    "react-hooks-js/config": "error",
    "react-hooks-js/error-boundaries": "error",
    "react-hooks-js/exhaustive-deps": "error",
    "react-hooks-js/gating": "error",
    "react-hooks-js/globals": "error",
    "react-hooks-js/immutability": "error",
    "react-hooks-js/incompatible-library": "error",
    "react-hooks-js/preserve-manual-memoization": "error",
    "react-hooks-js/purity": "error",
    "react-hooks-js/refs": "error",
    "react-hooks-js/rules-of-hooks": "error",
    "react-hooks-js/set-state-in-effect": "error",
    "react-hooks-js/set-state-in-render": "error",
    "react-hooks-js/static-components": "error",
    "react-hooks-js/unsupported-syntax": "error",
    "react-hooks-js/use-memo": "error",
    "react/hook-use-state": "error",
    "react/jsx-curly-brace-presence": "error",
    "react/jsx-fragments": "error",
    "react/jsx-no-useless-fragment": "error",
    "react/no-clone-element": "error",
    "react/no-danger": "error",
    "react/no-object-type-as-default-prop": "error",
    "react/no-react-children": "error",
    "react/no-set-state": "error",
    "react/prefer-function-component": "error",
    "react/self-closing-comp": "error",
    "require-await": "error",
    "symbol-description": "error",
    "unicorn/catch-error-name": "error",
    "unicorn/consistent-empty-array-spread": "error",
    "unicorn/consistent-function-scoping": "error",
    "unicorn/error-message": "error",
    "unicorn/escape-case": "error",
    "unicorn/filename-case": [
      "error",
      {
        cases: {
          camelCase: true,
          pascalCase: true,
        },
        multipleFileExtensions: true,
      },
    ],
    "unicorn/new-for-builtins": "error",
    "unicorn/no-abusive-eslint-disable": "error",
    "unicorn/no-hex-escape": "error",
    "unicorn/no-instanceof-builtins": "error",
    "unicorn/no-invalid-fetch-options": "error",
    "unicorn/no-magic-array-flat-depth": "error",
    "unicorn/no-new-buffer": "error",
    "unicorn/no-process-exit": "error",
    "unicorn/no-typeof-undefined": "error",
    "unicorn/no-unnecessary-array-flat-depth": "error",
    "unicorn/no-unnecessary-slice-end": "error",
    "unicorn/no-useless-promise-resolve-reject": "error",
    "unicorn/no-useless-spread": "error",
    "unicorn/numeric-separators-style": "error",
    "unicorn/prefer-array-flat-map": "error",
    "unicorn/prefer-array-index-of": "error",
    "unicorn/prefer-array-some": "error",
    "unicorn/prefer-at": "error",
    "unicorn/prefer-code-point": "error",
    "unicorn/prefer-dom-node-append": "error",
    "unicorn/prefer-includes": "error",
    "unicorn/prefer-logical-operator-over-ternary": "error",
    "unicorn/prefer-modern-math-apis": "error",
    "unicorn/prefer-native-coercion-functions": "error",
    "unicorn/prefer-node-protocol": "error",
    "unicorn/prefer-number-properties": "error",
    "unicorn/prefer-optional-catch-binding": "error",
    "unicorn/prefer-set-has": "error",
    "unicorn/prefer-set-size": "error",
    "unicorn/prefer-string-raw": "error",
    "unicorn/prefer-string-replace-all": "error",
    "unicorn/prefer-string-slice": "error",
    "unicorn/prefer-structured-clone": "error",
    "unicorn/prefer-top-level-await": "error",
    "unicorn/require-number-to-fixed-digits-argument": "error",
    "unicorn/text-encoding-identifier-case": "error",
    "unicorn/throw-new-error": "error",
    "unused-imports/no-unused-imports": "error",
    "use-isnan": "error",
    "valid-typeof": "error",
  },
};

const ENVIRONMENTS = {
  browser: {
    browser: true,
    builtin: true,
    es2024: true,
  },
  node: {
    builtin: true,
    es2024: true,
    node: true,
  },
  universal: {
    builtin: true,
    es2024: true,
  },
};

const createDomainRestrictedImports = (domainForbiddenImportPatterns) => ({
  paths: [
    ...BASE_RESTRICTED_IMPORTS.paths,
    { message: "Domain code must not depend on React.", name: "react" },
    { message: "Domain code must not depend on React DOM.", name: "react-dom" },
  ],
  patterns: [
    ...BASE_RESTRICTED_IMPORTS.patterns,
    {
      group: ["react/*", "react-dom/*", ...domainForbiddenImportPatterns],
      message: "Domain code may only depend on domain and explicitly injected ports.",
    },
  ],
});

const createUiRestrictedImports = (uiForbiddenImportPatterns) => ({
  paths: BASE_RESTRICTED_IMPORTS.paths,
  patterns: [
    ...BASE_RESTRICTED_IMPORTS.patterns,
    {
      group: uiForbiddenImportPatterns,
      message:
        "UI code must use an injected capability instead of importing infrastructure directly.",
    },
  ],
});

const createCapabilityOverrides = ({
  domainFiles = [],
  domainForbiddenImportPatterns = DEFAULT_DOMAIN_IMPORT_PATTERNS,
  effectBoundaryFiles = [],
  uiFiles = [],
  uiForbiddenImportPatterns = DEFAULT_UI_IMPORT_PATTERNS,
}) => {
  const overrides = [];

  if (domainFiles.length > 0) {
    overrides.push({
      files: domainFiles,
      rules: {
        "no-restricted-imports": [
          "error",
          createDomainRestrictedImports(domainForbiddenImportPatterns),
        ],
      },
    });
  }

  if (uiFiles.length > 0) {
    overrides.push({
      files: uiFiles,
      rules: {
        "no-restricted-globals": ["error", ...UI_RESTRICTED_GLOBALS],
        "no-restricted-imports": ["error", createUiRestrictedImports(uiForbiddenImportPatterns)],
        "no-restricted-properties": ["error", ...UI_RESTRICTED_PROPERTIES],
      },
    });
  }

  return { effectBoundaryFiles, overrides };
};

const getEnvironment = (environment) => {
  const env = ENVIRONMENTS[environment];

  if (!env) {
    throw new RangeError(`Unknown hygiene environment: ${environment}`);
  }

  return env;
};

const createDirectEffectOverrides = (banDirectEffects, effectBoundaryFiles) =>
  banDirectEffects
    ? [
        {
          excludeFiles: effectBoundaryFiles,
          files: SOURCE_FILES,
          rules: {
            "hygiene/no-direct-effects": "error",
          },
        },
      ]
    : [];

const createTypeCheckOptions = (typeCheck) => (typeCheck ? { typeCheck: true } : {});

const createHygieneConfig = (options = {}) => {
  const {
    architecture = {},
    banDirectEffects = false,
    environment = "browser",
    typeCheck = false,
  } = options;
  const { effectBoundaryFiles, overrides } = createCapabilityOverrides(architecture);
  const directEffectOverrides = createDirectEffectOverrides(banDirectEffects, effectBoundaryFiles);

  return {
    ...baseConfig,
    env: getEnvironment(environment),
    options: {
      ...baseConfig.options,
      ...createTypeCheckOptions(typeCheck),
    },
    overrides: [...baseConfig.overrides, ...overrides, ...directEffectOverrides],
  };
};

/** Strict shared Oxlint baseline for modern React and TypeScript projects. */
export default baseConfig;

/** Creates a runtime-specific strict config with optional capability boundaries. */
export const defineHygieneConfig = createHygieneConfig;

/** Opt-in preset that also forbids direct React effect hooks. */
export const noDirectEffects = createHygieneConfig({ banDirectEffects: true });

/** Strict preset for Node.js source files without browser globals. */
export const nodeConfig = createHygieneConfig({ environment: "node" });

/** Strict preset for publishable libraries, including compiler diagnostics. */
export const libraryConfig = {
  ...createHygieneConfig({ environment: "universal", typeCheck: true }),
  rules: {
    ...baseConfig.rules,
    "typescript/explicit-function-return-type": "error",
    "typescript/explicit-member-accessibility": "error",
  },
};

/** Opinionated architecture preset with explicit effects, I/O, storage, time, and import boundaries. */
export const capabilityArchitecture = createHygieneConfig({
  architecture: DEFAULT_CAPABILITY_ARCHITECTURE,
  banDirectEffects: true,
  typeCheck: true,
});
