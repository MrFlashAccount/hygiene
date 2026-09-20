# hygiene

Shared frontend hygiene defaults for React + Vite projects.

`@sergeigarin/hygene` gives you one reusable, deliberately strict baseline for TypeScript, Oxlint, Fallow, and Oxfmt, so you can stop rebuilding the same quality stack every time you start a new app.

It is intentionally narrow:

- built for React + Vite codebases
- centered on TypeScript, Oxlint, Fallow, and Oxfmt
- shared where consistency helps
- local where project reality still matters

What is React/Vite-specific here is mostly the default TypeScript shape and the expected consumer setup. The lint rules are broader, but the package is still tuned for modern React app repos rather than generic JavaScript projects.

That local-vs-shared split is the point: the package gives you the baseline, while each app keeps its own ignores, test setup, generated files, and build-tool wiring.

## Best for

- teams or solo builders with multiple React + Vite apps
- projects that want one lint/type/format baseline across repos
- codebases that want shared standards without hiding all config behind a giant internal platform package

## Not for

- non-React or non-Vite stacks
- repos that want fully centralized app policy with no local overrides
- projects looking for a broad framework-agnostic frontend toolkit

## What you get

- `@sergeigarin/hygene` → shared `oxlint` config
- `@sergeigarin/hygene/tsconfig.json` → shared TypeScript baseline
- `@sergeigarin/hygene/fallow.config.json` → strict codebase-health baseline with complete source coverage
- `@sergeigarin/hygene/fallow.react-architecture.config.json` → layered React capability architecture
- `hygiene-fallow` → enforced Fallow checks and guarded dead-code fixes
- `@sergeigarin/hygene/oxfmt.json` → intentionally minimal Oxfmt baseline

The default lint config enables:

- type-aware TypeScript checks for unsafe values, floating promises, assertions, exhaustiveness, and strict boolean expressions
- complexity, nesting, parameter, magic-number, import-cycle, barrel-file, promise, and semantic JavaScript limits
- React Doctor's recommended rules plus the official React Hooks compiler rules
- additional modern React restrictions such as no `cloneElement`, class `setState`, `React.Children`, or `dangerouslySetInnerHTML`
- strict Vitest rules for test files
- a local rule that requires every TypeScript assertion except `as const` to have an adjacent justification
- browser-only globals by default, so Node globals cannot leak into application source accidentally

## Quick start

Install the package and the tools you actually run in the consumer app:

```sh
npm install -D @sergeigarin/hygene fallow oxlint oxlint-tsgolint typescript oxfmt
```

Type-aware linting uses `oxlint-tsgolint` and therefore the TypeScript 7 type system. The exported `tsconfig.json` itself requires TypeScript 5.8 or newer.
The package and its current toolchain require Node.js 22.13 or newer.

### TypeScript

```json
{
  "extends": "@sergeigarin/hygene/tsconfig.json",
  "include": ["src", "vite.config.ts"]
}
```

Keep `include`, `types`, test coverage, e2e files, and tool-specific wiring local to the consumer project.

The package also exports focused TypeScript bases:

- `tsconfig.base.json` — strict runtime-neutral compiler options
- `tsconfig.node.json` — Node.js globals without DOM globals
- `tsconfig.library.json` — declaration emit, isolated declarations, and dependency declaration checking

### Oxlint

```js
import base from "@sergeigarin/hygene";

export default {
  ...base,
  ignorePatterns: ["dist/**", "node_modules/**"],
};
```

The shared config is fully inlined in this package, so consumers depend on one baseline package instead of extending another config layer downstream.

Use the runtime-specific Node preset for scripts, services, and tooling:

```js
import { nodeConfig } from "@sergeigarin/hygene";

export default nodeConfig;
```

Projects extending `tsconfig.node.json` should also install a compatible `@types/node` version.

`libraryConfig` adds compiler diagnostics and explicit TypeScript API/member types for publishable packages.

### No direct effects

The default config rejects common effect anti-patterns, but it does not ban effects outright: synchronizing React with an external system is a legitimate use case.

Projects that put all synchronization behind named boundary hooks can opt into a full direct-effect ban:

```js
import { noDirectEffects } from "@sergeigarin/hygene";

export default {
  ...noDirectEffects,
  ignorePatterns: ["dist/**", "node_modules/**"],
};
```

This preset rejects imported or namespaced calls to `useEffect`, `useLayoutEffect`, and `useInsertionEffect`.

### Capability architecture

`capabilityArchitecture` is the opinionated end-to-end preset. It enables compiler diagnostics and the direct-effect ban, then applies conventional layer boundaries:

- `src/domain/**` cannot import React, UI, or infrastructure
- `src/components/**`, `src/features/**`, and `src/pages/**` cannot import infrastructure or directly access network, storage, wall-clock time, or randomness
- direct React effects are allowed only under `src/infrastructure/react/**` and `src/platform/effects/**`

```js
import { capabilityArchitecture } from "@sergeigarin/hygene";

export default capabilityArchitecture;
```

Projects with another layout should keep the same invariants and provide their own globs:

```js
import { defineHygieneConfig } from "@sergeigarin/hygene";

export default defineHygieneConfig({
  architecture: {
    domainForbiddenImportPatterns: ["**/adapters/**", "**/ui/**"],
    domainFiles: ["source/core/**/*.ts"],
    effectBoundaryFiles: ["source/adapters/react/**"],
    uiForbiddenImportPatterns: ["**/adapters/**"],
    uiFiles: ["source/ui/**/*.tsx"],
  },
  banDirectEffects: true,
  typeCheck: true,
});
```

The point is not a particular directory name. The invariant is that UI declares intent while injected capabilities own I/O, storage, time, randomness, and synchronization.

### Fallow

Create `.fallowrc.json` in the consumer repository:

```json
{
  "$schema": "./node_modules/fallow/schema.json",
  "extends": ["npm:@sergeigarin/hygene/fallow.config.json"]
}
```

The shared profile is deliberately blocking:

- every enabled rule is `error`; uncertain heuristics are `off`, never `warn`
- type-aware dead-code analysis must complete
- semantic duplication is rejected
- every reachable source file must belong to an architecture zone
- cyclomatic, cognitive, CRAP, and function-size limits are enforced
- the composite health score must be at least 85
- Fallow security candidates fail the check until they are verified and fixed or narrowly dismissed with a reason

The base profile assigns every `src/**` file to one mandatory source zone. That is the portable default: no source file can sit silently outside architecture coverage, but the package does not pretend that every repository has the same layers.

For the full React capability architecture, extend the dedicated profile instead:

```json
{
  "$schema": "./node_modules/fallow/schema.json",
  "extends": ["npm:@sergeigarin/hygene/fallow.react-architecture.config.json"]
}
```

It splits the application into `app`, `features`, `ui`, `application`, `ports`, `domain`, `infrastructure`, and `shared`. Ambient network, storage, clock, and randomness calls are forbidden from feature, UI, and domain code. Because an empty or misspelled zone is a failed check rather than a warning to accumulate, enable this profile only together with the matching directories or replace its `zones` and `rules` in the child config. Projects that need sibling-feature isolation can add Fallow's `autoDiscover` after the feature directory exists.

Add the commands to the consumer:

```json
{
  "scripts": {
    "quality:fallow": "hygiene-fallow check",
    "quality:fallow:fix": "hygiene-fallow fix -- npm run validate"
  }
}
```

`check` runs dead code and architecture, duplication, per-function health limits, the health-score gate, and security as separate hard gates. Override the score floor explicitly when a project has a stronger contract:

```sh
hygiene-fallow check --min-score 90
```

`HYGIENE_FALLOW_MIN_SCORE` provides the same override in CI. Child Fallow configs can override object fields normally; arrays such as zones and rules replace the inherited arrays, which makes architectural customization explicit.

`fix` applies only Fallow's evidence-backed automatic fixes, such as removing unused exports, dependencies, and enum members. It refuses to run without a validation command and always invokes that command afterward. Unused whole files stay as hard failures for deliberate review instead of being deleted speculatively.

### Oxfmt

```sh
oxfmt --config ./node_modules/@sergeigarin/hygene/oxfmt.json --check .
```

Right now the shared `oxfmt` surface is intentionally minimal. The value is having one stable config entrypoint across repos, while consumer-specific ignore files and formatter workflow stay local.

### Agent instructions

The package includes a short, editable `AGENTS.md` template for coding agents. It documents the design rules that lint cannot fully enforce without copying app-specific architecture into the shared package.

Copy it into a consumer repository:

```sh
cp node_modules/@sergeigarin/hygene/templates/AGENTS.md ./AGENTS.md
```

Replace `<project validation command>` with the repository's authoritative check. Keep the commented capability-architecture section only when the project enables `noDirectEffects`, `capabilityArchitecture`, or equivalent custom boundaries. Add runtime, release, generated-file, and folder-layout rules locally rather than expanding the shared template.

## What should stay local

This package is the baseline, not your whole frontend policy.

Keep these in the consumer repo:

- ignore patterns like `dist/**`, `coverage/**`, `storybook-static/**`, generated folders, and caches
- app-specific lint overrides
- test, e2e, and build-tool includes
- anything tied to one runtime, folder layout, or framework slice
- Fallow entrypoints, framework wiring, generated-code ignores, coverage path, and project-specific architecture zones

## Validation

```sh
npm_config_cache=.npm-cache npm run validate
```

This runs the complete package contract:

- loads every native and JavaScript Oxlint rule
- rejects unused suppression comments and runs type-aware linting
- compiles the public TypeScript declarations
- runs contract tests for assertion justification, effect boundaries, and capability boundaries
- installs the packed tarball into a clean consumer and lints consumer TypeScript
- enforces type-aware dead code, architecture coverage, semantic duplication, health, and security with Fallow
- validates package exports with Publint and TypeScript/ESM resolution with Are The Types Wrong

## Release flow

### Local

```sh
npm run changeset
npm run version-packages
npm run release
```

### GitHub

- `CI` validates the package on `push` and `pull_request`
- `Release` uses Changesets to create or update the release PR on `master`
- merging the release PR publishes the package to npm
