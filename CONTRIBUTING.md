# Contributing

Thanks for contributing to `@sergeigarin/hygene`.

This package is intentionally small. The goal is to keep one reusable frontend hygiene baseline for React + Vite projects without turning it into a giant internal platform.

## What belongs here

Good contributions usually improve one of these:

- shared TypeScript baseline
- shared oxlint baseline
- shared oxfmt baseline
- packaging, release flow, or README clarity

## What should stay out

Please do not move project-specific policy into the shared package unless it is clearly reusable.

That usually means keeping these local in consumer repos:

- ignore patterns for build output, caches, coverage, or generated files
- app-specific lint overrides
- test, e2e, or toolchain wiring tied to one repo
- folder-layout or runtime-specific rules

## Development

Use a current Node LTS release.

Install dependencies:

```sh
npm install --no-fund --no-audit
```

Run the package check:

```sh
npm run validate
```

## Changesets

If your change affects package behavior, exported config, or published docs, add a changeset:

```sh
npm run changeset
```

To prepare versions locally:

```sh
npm run version-packages
```

Publishing is handled by the GitHub Changesets workflow on `master`.

## Pull requests

Please keep pull requests:

- small and focused
- easy to review
- documented when behavior changes
- aligned with the package scope

If you change the shared baseline, explain why the rule belongs in a reusable package rather than in one app.
