<template>
  <div class="ue-editor">
    <div ref="root"></div>
  </div>
</template>

<script>
import axios from 'axios'

const loadedResources = {
  css: {},
  scripts: {},
}

function appendStyleOnce(href) {
  if (!href || loadedResources.css[href]) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
  loadedResources.css[href] = true
}

function loadScriptOnce(src) {
  if (loadedResources.scripts[src]) return loadedResources.scripts[src]

  loadedResources.scripts[src] = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = false
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`UEditor script load failed: ${src}`))
    document.head.appendChild(script)
  })

  return loadedResources.scripts[src]
}

export default {
  name: 'UeEditor',
  model: {
    prop: 'value',
    event: 'input',
  },
  props: {
    value: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    height: {
      type: [Number, String],
      default: 300,
    },
    lang: {
      type: String,
      default: 'zh-cn',
    },
    config: {
      type: Object,
      default: () => ({}),
    },
    baseUrl: {
      type: String,
      default: '/static/ueditor-plus/',
    },
    uploadUrl: {
      type: String,
      default: '',
    },
    uploadHeaders: {
      type: Object,
      default: () => ({}),
    },
    uploadData: {
      type: Object,
      default: () => ({}),
    },
    uploadRequest: {
      type: Function,
      default: null,
    },
  },
  data() {
    return {
      editorId: `ue_editor_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      editor: null,
      ready: false,
      lastEmittedValue: null,
      sourceEl: null,
      initialHtml: '',
    }
  },
  watch: {
    value(newVal) {
      if (!this.ready || !this.editor) {
        const next = typeof newVal === 'string' ? newVal : newVal == null ? '' : String(newVal)
        this.initialHtml = next
        if (this.sourceEl) {
          this.sourceEl.innerHTML = next
        }
        return
      }
      if (newVal === this.lastEmittedValue) return
      const next = typeof newVal === 'string' ? newVal : newVal == null ? '' : String(newVal)
      const current = this.editor.getContent()
      if (next !== current) {
        this.editor.setContent(next, false)
      }
    },
    disabled(newVal) {
      if (!this.ready || !this.editor) return
      if (newVal) this.editor.setDisabled()
      else this.editor.setEnabled()
    },
  },
  async mounted() {
    this.initialHtml = this.value || ''
    this.ensureSourceElement()
    await this.$nextTick()
    await this.initEditor()
  },
  beforeDestroy() {
    this.destroyEditor()
  },
  methods: {
    normalizeMaybeFunctionString(value) {
      if (typeof value !== 'string') return ''
      const trimmed = value.trim()
      if (!trimmed) return ''
      if (/^function\s*\(/.test(trimmed) || /^\(\s*function\s*\(/.test(trimmed)) return ''
      return value
    },
    ensureSourceElement() {
      if (this.sourceEl) return this.sourceEl
      const root = this.$refs.root
      if (!root) return null

      const el = document.createElement('script')
      el.type = 'text/plain'
      el.id = this.editorId
      el.style.width = '100%'
      el.style.height = `${this.getFrameHeight()}px`
      el.innerHTML = this.initialHtml || ''
      root.appendChild(el)
      this.sourceEl = el
      return el
    },
    getUeditorBaseUrl() {
      return this.baseUrl.replace(/\/?$/, '/')
    },
    normalizeEditorOptions(options) {
      const next = { ...(options || {}) }

      next.iframeCssUrlsAddition = Array.isArray(next.iframeCssUrlsAddition)
        ? next.iframeCssUrlsAddition.filter((item) => typeof item === 'string' && item)
        : []

      next.iframeCssStylesAddition = Array.isArray(next.iframeCssStylesAddition)
        ? next.iframeCssStylesAddition.filter((item) => typeof item === 'string' && item)
        : []

      next.iframeCssUrl =
        typeof next.iframeCssUrl === 'string' ? this.normalizeMaybeFunctionString(next.iframeCssUrl) : ''
      next.iframeJsUrl = typeof next.iframeJsUrl === 'string' ? next.iframeJsUrl : ''
      next.initialContent = typeof next.initialContent === 'string' ? next.initialContent : ''
      next.iframeCssStyles =
        typeof next.iframeCssStyles === 'string' ? this.normalizeMaybeFunctionString(next.iframeCssStyles) : ''
      next.iframeCssUrls = Array.isArray(next.iframeCssUrls)
        ? next.iframeCssUrls.filter((item) => typeof item === 'string' && this.normalizeMaybeFunctionString(item))
        : []
      next.imageAllowFiles = Array.isArray(next.imageAllowFiles) && next.imageAllowFiles.length
        ? next.imageAllowFiles
        : ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg']
      next.videoAllowFiles = Array.isArray(next.videoAllowFiles) && next.videoAllowFiles.length
        ? next.videoAllowFiles
        : ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.mpeg', '.mpg']
      next.audioAllowFiles = Array.isArray(next.audioAllowFiles) && next.audioAllowFiles.length
        ? next.audioAllowFiles
        : ['.mp3', '.wav', '.ogg', '.m4a', '.aac']
      next.fileAllowFiles = Array.isArray(next.fileAllowFiles) && next.fileAllowFiles.length
        ? next.fileAllowFiles
        : ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.txt', '.mp4']

      if (typeof next.loadConfigFromServer !== 'boolean') next.loadConfigFromServer = false
      if (typeof next.serverUrl !== 'string') next.serverUrl = ''

      return next
    },
    isUploadBinary(value) {
      if (!value || typeof value !== 'object') return false

      const tag = Object.prototype.toString.call(value)
      return tag === '[object File]' || tag === '[object Blob]'
    },
    extractUploadRawFile(file) {
      const visited = new Set()
      const queue = [file]

      while (queue.length) {
        const current = queue.shift()
        if (!current || visited.has(current)) continue
        visited.add(current)

        if (this.isUploadBinary(current)) return current

        if (current.blob) queue.push(current.blob)
        if (current.file) queue.push(current.file)
        if (current._raw) queue.push(current._raw)
        if (current.source) queue.push(current.source)

        if (typeof current.getSource === 'function') {
          try {
            queue.push(current.getSource())
          } catch (error) {}
        }
      }

      return null
    },
    getUploadFileName(file, rawFile, type) {
      return (
        (file && file.name) ||
        (file && file.file && file.file.name) ||
        (rawFile && rawFile.name) ||
        `${type || 'file'}-${Date.now()}`
      )
    },
    getUploadErrorMessage(message, extra) {
      if (typeof message === 'string' && message) return message
      if (extra && typeof extra.msg === 'string' && extra.msg) return extra.msg
      return 'upload failed'
    },
    extractUploadUrl(response) {
      if (!response) return ''
      if (typeof response === 'string') {
        const trimmed = response.trim()
        if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed
        return ''
      }
      return (
        response.url ||
        response.src ||
        response.path ||
        (response.data && response.data.url) ||
        (response.data && response.data.src) ||
        (response.data && response.data.path) ||
        (response.data && typeof response.data === 'string' && response.data) ||
        (response.data && response.data.data && response.data.data.url) ||
        (response.result && response.result.url) ||
        ''
      )
    },
    async defaultUploadRequest(type, file, callback) {
      if (!this.uploadUrl) {
        callback && callback.error && callback.error(this.getUploadErrorMessage('upload url missing'))
        return
      }

      const rawFile = this.extractUploadRawFile(file)
      if (!rawFile) {
        callback && callback.error && callback.error(this.getUploadErrorMessage('invalid upload file object'))
        return
      }

      const formData = new FormData()
      formData.append('file', rawFile, this.getUploadFileName(file, rawFile, type))
      formData.append('type', type)
      Object.keys(this.uploadData || {}).forEach((key) => {
        formData.append(key, this.uploadData[key])
      })

      try {
        const response = await axios.post(this.uploadUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(this.uploadHeaders || {}),
          },
          onUploadProgress: (event) => {
            if (!event || !event.total) return
            const percent = event.total > 0 ? event.loaded / event.total : 0
            callback && callback.progress && callback.progress(percent)
          },
        })
        const data = response && response.data
        const url = this.extractUploadUrl(data)

        if (!url) {
          callback &&
            callback.error &&
            callback.error(this.getUploadErrorMessage('upload failed', data))
          return
        }

        callback && callback.success && callback.success({ state: 'SUCCESS', url })
      } catch (error) {
        const responseData = error && error.response ? error.response.data : null
        callback &&
          callback.error &&
          callback.error(
            this.getUploadErrorMessage(
              (responseData && (responseData.msg || responseData.message)) ||
                (error && error.message) ||
                'network error',
              responseData,
            ),
          )
      }
    },
    async ensureUeditorAssets() {
      const baseUrl = this.getUeditorBaseUrl()

      window.UEDITOR_HOME_URL = baseUrl
      window.UEDITOR_CORS_URL = baseUrl

      appendStyleOnce(`${baseUrl}themes/default/css/ueditor.css`)

      await loadScriptOnce(`${baseUrl}ueditor.config.js`)
      window.UEDITOR_CONFIG = window.UEDITOR_CONFIG || {}

      const config = window.UEDITOR_CONFIG

      if (!config.toolbarShows || typeof config.toolbarShows !== 'object' || Array.isArray(config.toolbarShows)) {
        config.toolbarShows = {}
      }
      if (!Array.isArray(config.iframeCssUrlsAddition)) config.iframeCssUrlsAddition = []
      if (!Array.isArray(config.iframeCssStylesAddition)) config.iframeCssStylesAddition = []
      if (typeof config.iframeCssUrl !== 'string') config.iframeCssUrl = ''
      if (typeof config.iframeJsUrl !== 'string') config.iframeJsUrl = ''
      if (typeof config.iframeCssStyles !== 'string') config.iframeCssStyles = ''
      if (!Array.isArray(config.iframeCssUrls)) config.iframeCssUrls = []

      config.iframeCssUrl = this.normalizeMaybeFunctionString(config.iframeCssUrl)
      config.iframeCssStyles = this.normalizeMaybeFunctionString(config.iframeCssStyles)
      if (!config.iframeCssUrl) {
        config.iframeCssUrl = `${baseUrl}themes/iframe.css`
      }
      if (typeof config.initialContent !== 'string') {
        config.initialContent = ''
      }
      if (typeof config.serverResponsePrepare !== 'function') {
        config.serverResponsePrepare = (res) => {
          if (!res) return res
          if (res && typeof res === 'object' && typeof res.state === 'string') return res

          let obj = res
          if (typeof obj === 'string') {
            try {
              obj = JSON.parse(obj)
            } catch (e) {
              return res
            }
          }

          if (obj && typeof obj === 'object' && typeof obj.state === 'string') return obj

          const url = this.extractUploadUrl(obj)
          if (!url) return res

          return {
            state: 'SUCCESS',
            url,
            title: '',
            original: '',
            type: '',
            size: 0,
          }
        }
      }

      config.loadConfigFromServer = false
      config.serverUrl = this.uploadUrl || ''
      config.serverHeaders = {
        ...(config.serverHeaders || {}),
        ...(this.uploadHeaders || {}),
      }
      config.imageFieldName = 'file'
      config.videoFieldName = 'file'
      config.fileFieldName = 'file'
      config.imageUrlPrefix = typeof config.imageUrlPrefix === 'string' ? config.imageUrlPrefix : ''
      config.videoUrlPrefix = typeof config.videoUrlPrefix === 'string' ? config.videoUrlPrefix : ''
      config.fileUrlPrefix = typeof config.fileUrlPrefix === 'string' ? config.fileUrlPrefix : ''
      config.audioUrlPrefix = typeof config.audioUrlPrefix === 'string' ? config.audioUrlPrefix : ''

      config.imageActionName = config.imageActionName || 'uploadimage'
      config.videoActionName = config.videoActionName || 'uploadvideo'
      config.audioActionName = config.audioActionName || 'uploadaudio'
      config.fileActionName = config.fileActionName || 'uploadfile'

      config.uploadServiceEnable = true
      config.uploadServiceUpload = async (type, file, callback, option) => {
        if (this.uploadRequest) {
          return this.uploadRequest(type, file, callback, option)
        }
        return this.defaultUploadRequest(type, file, callback, option)
      }

      await loadScriptOnce(`${baseUrl}ueditor.all.js`)

      if (window.UE && window.UE.utils && typeof window.UE.utils.unhtml === 'function') {
        const originalUnhtml = window.UE.utils.unhtml
        window.UE.utils.unhtml = function (str, reg) {
          if (str == null) return ''
          if (typeof str !== 'string') str = String(str)
          return originalUnhtml.call(this, str, reg)
        }
      }

      const langFile = `${baseUrl}lang/${this.lang}/${this.lang}.js`
      await loadScriptOnce(langFile)
    },
    getFrameHeight() {
      if (typeof this.height === 'number' && Number.isFinite(this.height)) return this.height
      if (typeof this.height === 'string' && this.height.trim()) {
        const num = Number(this.height)
        if (Number.isFinite(num)) return num
      }
      return 300
    },
    async initEditor() {
      await this.ensureUeditorAssets()
      this.ensureSourceElement()

      if (!window.UE || typeof window.UE.getEditor !== 'function') {
        throw new Error('UEditor not available on window.UE')
      }

      const options = this.normalizeEditorOptions({
        initialFrameHeight: this.getFrameHeight(),
        ...this.config,
      })
      if (!options.iframeCssUrl) {
        options.iframeCssUrl = `${this.getUeditorBaseUrl()}themes/iframe.css`
      }
      if (typeof options.iframeCssStyles !== 'string') {
        options.iframeCssStyles = ''
      }

      this.editor = window.UE.getEditor(this.editorId, options)
      this.editor.ready(() => {
        this.ready = true
        const initial =
          typeof this.value === 'string' ? this.value : this.value == null ? '' : String(this.value)
        if (initial) {
          this.editor.setContent(initial, false)
        }
        if (this.disabled) {
          this.editor.setDisabled()
        } else if (typeof this.editor.setEnabled === 'function') {
          this.editor.setEnabled()
        }

        this.editor.addListener('contentChange', () => {
          const html = this.editor.getContent()
          this.lastEmittedValue = html
          this.$emit('input', html)
          this.$emit('change', html)
        })

        this.$emit('ready', this.editor)
      })
    },
    destroyEditor() {
      try {
        if (this.editor && typeof this.editor.destroy === 'function') {
          this.editor.destroy()
        }
      } finally {
        this.editor = null
        this.ready = false
        this.sourceEl = null
      }
    },
    getContent() {
      if (!this.editor) return ''
      return this.editor.getContent()
    },
    setContent(html, append = false) {
      if (!this.editor) return
      const next = typeof html === 'string' ? html : html == null ? '' : String(html)
      this.editor.setContent(next, !!append)
    },
    focus() {
      if (!this.editor) return
      this.editor.focus()
    },
    clear() {
      if (!this.editor) return
      this.editor.setContent('', false)
    },
  },
}
</script>

<style scoped>
.ue-editor {
  width: 100%;
}
</style>
