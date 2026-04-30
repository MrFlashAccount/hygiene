# @sergeigarin/hygene

Один пакет с базовыми фронтенд hygiene-настройками, вынесенными из launcher.

Внутри только root-файлы:
- `package.json`
- `README.md`
- `.gitignore`
- `tsconfig.json`
- `oxfmt.json`
- `oxlint.config.mjs`

## Что экспортируется

- `@sergeigarin/hygene` → общий `oxlint` config
- `@sergeigarin/hygene/tsconfig.json` → общий TypeScript baseline
- `@sergeigarin/hygene/oxfmt.json` → общий oxfmt baseline

## Usage

TypeScript:

```json
{
  "extends": "@sergeigarin/hygene/tsconfig.json",
  "include": ["src", "vite.config.ts"]
}
```

`include`, `types`, test/e2e coverage и прочие tool-specific куски держи локально в consumer-проекте.

Oxlint:

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

`@nkzw/oxlint-config` сюда уже инлайнен. Внешнего extend/import на него больше нет.

Локально у consumer'а должны оставаться:
- ignore patterns (`dist/**`, `coverage/**`, `storybook-static/**`, generated dirs, caches)
- project-specific overrides
- app/test/tool includes

Oxfmt:

```sh
oxfmt --config ./node_modules/@sergeigarin/hygene/oxfmt.json --check .
```

## Validation

```sh
npm_config_cache=.npm-cache npm run validate
```

Это только smoke-check: импорт конфига, парсинг JSON-файлов и `npm pack --dry-run`.
