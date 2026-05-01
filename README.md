# hygiene

Shared frontend hygiene defaults for React + Vite projects.

`@sergeigarin/hygene` gives you one reusable baseline for TypeScript, oxlint, and oxfmt, so you can stop rebuilding the same config stack every time you start a new app.

It is intentionally narrow:

- built for React + Vite codebases
- centered on TypeScript, oxlint, and oxfmt
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
- `@sergeigarin/hygene/oxfmt.json` → intentionally minimal oxfmt baseline

## Quick start

Install the package and the tools you actually run in the consumer app:

```sh
npm install -D @sergeigarin/hygene oxlint oxfmt
```

### TypeScript

```json
{
  "extends": "@sergeigarin/hygene/tsconfig.json",
  "include": ["src", "vite.config.ts"]
}
```

Keep `include`, `types`, test coverage, e2e files, and tool-specific wiring local to the consumer project.

### Oxlint

```js
import base from "@sergeigarin/hygene";

export default {
  ...base,
  ignorePatterns: [
    "dist/**",
    "node_modules/**"
  ]
};
```

The shared config is fully inlined in this package, so consumers depend on one baseline package instead of extending another config layer downstream.

### Oxfmt

```sh
oxfmt --config ./node_modules/@sergeigarin/hygene/oxfmt.json --check .
```

Right now the shared `oxfmt` surface is intentionally minimal. The value is having one stable config entrypoint across repos, while consumer-specific ignore files and formatter workflow stay local.

## What should stay local

This package is the baseline, not your whole frontend policy.

Keep these in the consumer repo:

- ignore patterns like `dist/**`, `coverage/**`, `storybook-static/**`, generated folders, and caches
- app-specific lint overrides
- test, e2e, and build-tool includes
- anything tied to one runtime, folder layout, or framework slice

## Validation

```sh
npm_config_cache=.npm-cache npm run validate
```

This runs a small smoke check:

- imports the shared `oxlint` config
- parses the exported JSON configs
- verifies the package can be packed cleanly with `npm pack --dry-run`

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
