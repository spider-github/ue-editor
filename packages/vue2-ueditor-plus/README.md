# vue2-ueditor-plus-editor

Vue 2 wrapper for UEditorPlus with asset copy CLI.

## Install

```bash
npm install vue axios vue2-ueditor-plus-editor ueditor-plus-assets
```

## Copy static assets

```bash
npx vue2-ueditor-plus-editor copy-assets public/static/ueditor-plus
```

## Usage

```js
import Vue from 'vue'
import UeEditor from 'vue2-ueditor-plus-editor'
import 'vue2-ueditor-plus-editor/style.css'

Vue.use(UeEditor)
```

```vue
<template>
  <UeEditor
    v-model="content"
    base-url="/static/ueditor-plus/"
    upload-url="/api/upload"
  />
</template>
```
