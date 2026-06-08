# Vue2 UEditor Plus Monorepo

Monorepo for publishing a Vue 2 UEditorPlus component package, assets package, and demo app.

## Packages

- `packages/vue2-ueditor-plus`: `vue2-ueditor-plus-editor`
- `packages/ueditor-plus-assets`: `ueditor-plus-assets`
- `apps/demo-vue2`: local demo app

## Local development

```bash
pnpm install
pnpm dev:demo
```

## Copy assets in consumer project

```bash
npx vue2-ueditor-plus-editor copy-assets public/static/ueditor-plus
```

## Publish all packages

Run from repository root:

```bash
npm run publish:all
```
