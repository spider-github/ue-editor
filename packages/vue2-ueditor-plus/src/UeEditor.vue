<template>
  <div class="ue-editor">
    <div ref="root"></div>
  </div>
</template>

<script>
import axios from 'axios'
import hljs from 'highlight.js/lib/highlight'
import java from 'highlight.js/lib/languages/java'
import xml from 'highlight.js/lib/languages/xml'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import json from 'highlight.js/lib/languages/json'
import php from 'highlight.js/lib/languages/php'
import css from 'highlight.js/lib/languages/css'
import sql from 'highlight.js/lib/languages/sql'
import bash from 'highlight.js/lib/languages/bash'
import python from 'highlight.js/lib/languages/python'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import plaintext from 'highlight.js/lib/languages/plaintext'
import powershell from 'highlight.js/lib/languages/powershell'
import cs from 'highlight.js/lib/languages/cs'
import nginx from 'highlight.js/lib/languages/nginx'
import markdown from 'highlight.js/lib/languages/markdown'

hljs.registerLanguage('java', java)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('php', php)
hljs.registerLanguage('css', css)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('python', python)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('plaintext', plaintext)
hljs.registerLanguage('powershell', powershell)
hljs.registerLanguage('csharp', cs)
hljs.registerLanguage('nginx', nginx)
hljs.registerLanguage('markdown', markdown)

const loadedResources = {
  css: {},
  scripts: {},
}

const UEDITOR_CODE_BLOCK_IFRAME_STYLES = `
body :not(pre) > code,
body p code,
body li code,
body td code,
body th code,
body blockquote code {
  display: inline-block;
  margin: 0 3px;
  padding: 3px 6px;
  color: inherit;
  background-color: #f3f4f6;
  border-radius: 4px;
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 0.92em;
}

body p,
body h1,
body h2,
body h3,
body h4,
body h5,
body h6,
body table,
body pre,
body blockquote,
body ul,
body ol,
body hr {
  margin: 10px 0;
}

body blockquote {
  display: block;
  padding: 5px 10px;
  background-color: #f8fafc;
  border-left: 4px solid #d0e5f2;
}

body pre {
  padding: 0;
  overflow-x: auto;
  background: transparent;
  border-radius: 8px;
  line-height: 1.6;
  white-space: pre;
  box-sizing: border-box;
}

body pre > code,
body pre > code.hljs {
  display: block;
  margin: 0;
  padding: 1em;
  color: #24292f;
  background-color: #f6f8fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  text-align: left;
  white-space: pre;
  word-break: normal;
  word-spacing: normal;
  word-wrap: normal;
  overflow-wrap: normal;
  hyphens: none;
  tab-size: 4;
  box-sizing: border-box;
}

body pre > code.hljs {
  color: #383a42;
  background: #fafafa;
}

body pre > code .hljs-comment,
body pre > code .hljs-quote {
  color: #a0a1a7;
  font-style: italic;
}

body pre > code .hljs-doctag,
body pre > code .hljs-keyword,
body pre > code .hljs-formula {
  color: #a626a4;
}

body pre > code .hljs-section,
body pre > code .hljs-name,
body pre > code .hljs-selector-tag,
body pre > code .hljs-deletion,
body pre > code .hljs-subst {
  color: #e45649;
}

body pre > code .hljs-literal,
body pre > code .hljs-string,
body pre > code .hljs-regexp,
body pre > code .hljs-addition,
body pre > code .hljs-attribute,
body pre > code .hljs-meta .hljs-string {
  color: #50a14f;
}

body pre > code .hljs-attr,
body pre > code .hljs-variable,
body pre > code .hljs-template-variable,
body pre > code .hljs-type,
body pre > code .hljs-selector-class,
body pre > code .hljs-selector-attr,
body pre > code .hljs-selector-pseudo,
body pre > code .hljs-number {
  color: #986801;
}

body pre > code .hljs-symbol,
body pre > code .hljs-bullet,
body pre > code .hljs-link,
body pre > code .hljs-meta,
body pre > code .hljs-selector-id,
body pre > code .hljs-title {
  color: #4078f2;
}

body pre > code .hljs-built_in,
body pre > code .hljs-title.class_,
body pre > code .hljs-class .hljs-title {
  color: #c18401;
}

body pre > code .hljs-emphasis {
  font-style: italic;
}

body pre > code .hljs-strong {
  font-weight: 700;
}

body a {
  color: #0d6efd;
  text-decoration: none;
  cursor: pointer;
  word-break: break-word;
}

body a:hover,
body a:focus {
  text-decoration: underline;
}

body img {
  max-width: 100%;
}

body table {
  caption-side: bottom;
  border-collapse: collapse;
  display: table;
  margin-bottom: 10px;
}

body table td,
body table th {
  padding: 5px 10px;
  border: 1px solid #DDD;
  vertical-align: top;
}

body table.noBorderTable td,
body table.noBorderTable th,
body table.noBorderTable caption {
  border: 1px dashed #ddd !important;
}

body table tr.firstRow th,
body table tr.firstRow td {
  background-color: #f8fafc;
}

body ul,
body ol {
  padding-left: 32px;
}
`

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

function mergeStyleText(baseStyle, extraStyle) {
  const base = typeof baseStyle === 'string' ? baseStyle.trim() : ''
  const extra = typeof extraStyle === 'string' ? extraStyle.trim() : ''

  if (!extra) return base
  if (!base) return extra
  if (base.includes(extra)) return base
  return `${base}\n${extra}`
}

function normalizeHighlightLanguage(lang) {
  if (!lang) return ''
  const normalized = String(lang).toLowerCase()
  const aliasMap = {
    js: 'javascript',
    jscript: 'javascript',
    plain: 'plaintext',
    text: 'plaintext',
    txt: 'plaintext',
    shell: 'bash',
    sh: 'bash',
    ps: 'powershell',
    'c#': 'csharp',
    cs: 'csharp',
    html: 'xml',
    md: 'markdown',
  }
  return aliasMap[normalized] || normalized
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
      highlightTimer: null,
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
    isElementNode(node) {
      return !!node && node.nodeType === 1
    },
    extractCodeText(node) {
      if (!node) return ''
      if (node.nodeType === 3) return node.nodeValue || ''
      if (node.nodeType !== 1) return ''
      const tagName = node.tagName ? node.tagName.toUpperCase() : ''
      if (tagName === 'BR') return '\n'

      let text = ''
      const childNodes = node.childNodes ? Array.from(node.childNodes) : []
      childNodes.forEach((childNode) => {
        text += this.extractCodeText(childNode)
      })
      return text
    },
    restoreCopiedCodeBlocksHtml(html) {
      if (typeof html !== 'string' || !html) return html
      const div = document.createElement('div')
      div.innerHTML = html

      div.querySelectorAll('pre code').forEach((codeElement) => {
        if (!this.isElementNode(codeElement)) return
        const preElement = typeof codeElement.closest === 'function' ? codeElement.closest('pre') : null
        const encodedRawCode =
          codeElement.getAttribute('data-raw-code') ||
          (this.isElementNode(preElement) ? preElement.getAttribute('data-raw-code') : '') ||
          ''
        if (!encodedRawCode) return

        let rawText = ''
        try {
          rawText = decodeURIComponent(encodedRawCode)
        } catch (error) {
          rawText = ''
        }
        if (!rawText) return

        const language = this.getCodeLanguageFromElement(codeElement)
        codeElement.textContent = rawText
        codeElement.className = language ? `language-${language}` : ''
        codeElement.setAttribute('data-code-lang', language || '')
        codeElement.removeAttribute('data-raw-code')

        if (this.isElementNode(preElement)) {
          preElement.className = language ? `language-${language}` : ''
          preElement.setAttribute('data-code-lang', language || '')
          preElement.removeAttribute('data-raw-code')
        }
      })

      return div.innerHTML
    },
    getEditorDocument() {
      if (!this.editor || !this.editor.document) return null
      return this.editor.document
    },
    getCodeLanguageFromElement(codeElement) {
      if (!this.isElementNode(codeElement)) return ''
      const dataLang = codeElement.getAttribute('data-code-lang')
      if (dataLang) return normalizeHighlightLanguage(dataLang)

      const className = codeElement.className || ''
      let match = String(className).match(/(?:^|\s)language-([^\s]+)/)
      if (match && match[1]) return normalizeHighlightLanguage(match[1])

      match = String(className).match(/brush:([^;]+)/)
      return match && match[1] ? normalizeHighlightLanguage(match[1]) : ''
    },
    highlightCodeElement(codeElement) {
      if (!this.isElementNode(codeElement)) return

      const rawText = this.extractCodeText(codeElement)
        .replace(/\u00a0/g, ' ')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
      const language = this.getCodeLanguageFromElement(codeElement)
      const preElement = typeof codeElement.closest === 'function' ? codeElement.closest('pre') : null

      if (this.isElementNode(preElement)) {
        preElement.setAttribute('data-code-lang', language || '')
        preElement.className = language ? `language-${language}` : ''
      }
      codeElement.setAttribute('data-code-lang', language || '')
      codeElement.textContent = rawText

      if (!rawText) return

      codeElement.className = language ? `language-${language}` : ''

      if (language && hljs.getLanguage(language)) {
        if (typeof hljs.highlightElement === 'function') {
          hljs.highlightElement(codeElement)
        } else if (typeof hljs.highlightBlock === 'function') {
          hljs.highlightBlock(codeElement)
        }
      }
    },
    highlightAllCodeBlocks() {
      const doc = this.getEditorDocument()
      if (!doc) return
      doc.querySelectorAll('pre code').forEach((codeElement) => {
        this.highlightCodeElement(codeElement)
      })
    },
    highlightCurrentCodeBlock() {
      const doc = this.getEditorDocument()
      if (!doc || !this.editor || !this.editor.selection) return
      const range = this.editor.selection.getRange()
      const startContainer = range && range.startContainer
      const element =
        startContainer && startContainer.nodeType === 1
          ? startContainer
          : startContainer && startContainer.parentNode
      if (!this.isElementNode(element)) return
      const codeElement = typeof element.closest === 'function' ? element.closest('code') : null
      this.highlightCodeElement(codeElement)
    },
    scheduleHighlightAllCodeBlocks(delay = 0) {
      if (this.highlightTimer) {
        clearTimeout(this.highlightTimer)
      }
      this.highlightTimer = setTimeout(() => {
        this.highlightTimer = null
        this.highlightAllCodeBlocks()
      }, delay)
    },
    scheduleHighlightCurrentCodeBlock(delay = 0) {
      if (this.highlightTimer) {
        clearTimeout(this.highlightTimer)
      }
      this.highlightTimer = setTimeout(() => {
        this.highlightTimer = null
        this.highlightCurrentCodeBlock()
      }, delay)
    },
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
      config.initialStyle = mergeStyleText(
        typeof config.initialStyle === 'string' ? config.initialStyle : '',
        UEDITOR_CODE_BLOCK_IFRAME_STYLES,
      )
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
      options.initialStyle = mergeStyleText(
        typeof options.initialStyle === 'string' ? options.initialStyle : '',
        UEDITOR_CODE_BLOCK_IFRAME_STYLES,
      )
      if (!options.iframeCssUrl) {
        options.iframeCssUrl = `${this.getUeditorBaseUrl()}themes/iframe.css`
      }
      if (typeof options.iframeCssStyles !== 'string') {
        options.iframeCssStyles = ''
      }

      window.UEDITOR_CONFIG = {
        ...(window.UEDITOR_CONFIG || {}),
        ...options,
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

        this.scheduleHighlightAllCodeBlocks(30)

        this.editor.addListener('contentChange', () => {
          const html = this.editor.getContent()
          this.lastEmittedValue = html
          this.$emit('input', html)
          this.$emit('change', html)
        })

        this.editor.addListener('aftersetcontent', () => {
          this.$nextTick(() => {
            this.scheduleHighlightAllCodeBlocks(50)
          })
        })

        this.editor.addListener('beforepaste', (type, html) => {
          if (!html || typeof html.html !== 'string') return
          html.html = this.restoreCopiedCodeBlocksHtml(html.html)
        })

        this.editor.addListener('afterpaste', () => {
          this.$nextTick(() => {
            this.scheduleHighlightAllCodeBlocks(50)
          })
        })

        this.editor.addListener('afterinserthtml', () => {
          this.$nextTick(() => {
            this.scheduleHighlightAllCodeBlocks(50)
          })
        })

        this.editor.addListener('afterexeccommand', (type, cmd) => {
          if (String(cmd).toLowerCase() !== 'insertcode') return
          this.$nextTick(() => {
            this.scheduleHighlightCurrentCodeBlock(30)
          })
        })

        this.$emit('ready', this.editor)
      })
    },
    destroyEditor() {
      try {
        if (this.highlightTimer) {
          clearTimeout(this.highlightTimer)
          this.highlightTimer = null
        }
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

<style>
.ue-editor .edui-editor {
  position: static !important;
  z-index: auto !important;
  width: auto !important;

  > div[style^='height']:nth-child(1) {
    display: none;
  }

  .edui-editor-iframeholder {
    position: static !important;
    z-index: auto !important;
  }
}
</style>
