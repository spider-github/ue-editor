<template>
  <div class="page">
    <h1>Vue2 UEditor Plus Demo</h1>
    <UeEditor
      v-model="content"
      :height="360"
      base-url="/static/ueditor-plus/"
      :upload-url="uploadUrl"
    />
    <h2>Output</h2>
    <textarea :value="content" readonly />
  </div>
</template>

<script>
import { UeEditor } from 'vue2-ueditor-plus-editor'

export default {
  name: 'App',
  components: {
    UeEditor,
  },
  data() {
    return {
      content: '<p>hello ueditor plus</p>',
      uploadUrl: '',
    }
  },
}
</script>

<style>
body {
  font-family: sans-serif;
  margin: 0;
}

.page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 24px;
}

textarea {
  width: 100%;
  min-height: 200px;
}
</style>
