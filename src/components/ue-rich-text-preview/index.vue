<template>
  <div class="ue-rich-text-preview">
    <component :is="'style'">{{ renderStyles }}</component>
    <div ref="previewDOM" class="ue-rich-text-preview__content" v-html="content" />
  </div>
</template>

<script>
import { buildUeRichTextRenderStyles, highlightCodeBlocks } from './render'

export default {
  name: 'UeRichTextPreview',
  props: {
    content: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      highlightTimer: null,
      renderStyles: buildUeRichTextRenderStyles('.ue-rich-text-preview__content'),
    }
  },
  watch: {
    content() {
      this.scheduleHighlight()
    },
  },
  mounted() {
    this.scheduleHighlight()
  },
  beforeDestroy() {
    if (this.highlightTimer) {
      clearTimeout(this.highlightTimer)
      this.highlightTimer = null
    }
  },
  methods: {
    highlightPreview() {
      const previewDOM = this.$refs.previewDOM
      if (!previewDOM) return
      highlightCodeBlocks(previewDOM)
    },
    scheduleHighlight(delay = 0) {
      if (this.highlightTimer) {
        clearTimeout(this.highlightTimer)
      }
      this.highlightTimer = setTimeout(() => {
        this.highlightTimer = null
        this.highlightPreview()
      }, delay)
    },
  },
}
</script>

<style lang="scss" scoped>
.ue-rich-text-preview {
  width: 100%;
}

.ue-rich-text-preview__content {
  width: 100%;
}
</style>
