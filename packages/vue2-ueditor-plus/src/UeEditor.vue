<template>
  <div class="ue-editor">
    <div ref="root"></div>
  </div>
</template>

<script>
import Vue from 'vue'
import axios from 'axios'
import UeRichTextPreview from './UeRichTextPreview.vue'
import {
  buildUeRichTextRenderStyles,
  ensureUeRichTextLanguages,
  getCodeLanguageFromElement,
  highlightCodeBlocks,
  highlightCodeElement,
  isElementNode,
  normalizeUeRichTextHtml,
  restoreCopiedCodeBlocksHtml,
} from './ueRichTextRender'

ensureUeRichTextLanguages()

const loadedResources = {
  css: {},
  scripts: {},
}
const loadedLanguagePacks = {}

const UEDITOR_CODE_BLOCK_IFRAME_STYLES = buildUeRichTextRenderStyles('body')

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

function cacheLoadedLanguagePacks() {
  if (!window.UE || !window.UE.I18N || typeof window.UE.I18N !== 'object') return
  Object.keys(window.UE.I18N).forEach((langKey) => {
    if (window.UE.I18N[langKey]) {
      loadedLanguagePacks[langKey] = window.UE.I18N[langKey]
    }
  })
}

function setActiveLanguagePack(lang) {
  const normalizedLang = String(lang || '').toLowerCase()
  const activePack = loadedLanguagePacks[normalizedLang]
  const previousI18N =
    window.UE && window.UE.I18N && typeof window.UE.I18N === 'object' ? window.UE.I18N : {}

  if (window.UE) {
    window.UE.I18N = activePack ? { [normalizedLang]: activePack } : {}
  }

  return previousI18N
}

function restoreLanguagePacks(previousI18N) {
  const merged = {
    ...(previousI18N && typeof previousI18N === 'object' ? previousI18N : {}),
    ...loadedLanguagePacks,
  }
  if (window.UE) {
    window.UE.I18N = merged
  }
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
      previewDialog: null,
      previewVm: null,
      previewBodyOverflow: '',
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
      const current = this.normalizeEditorHtml(this.getRawEditorContent())
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
    this.closePreviewDialog()
    this.destroyEditor()
  },
  methods: {
    isElementNode(node) {
      return isElementNode(node)
    },
    restoreCopiedCodeBlocksHtml(html) {
      return restoreCopiedCodeBlocksHtml(html)
    },
    getEditorDocument() {
      if (!this.editor || !this.editor.document) return null
      return this.editor.document
    },
    getCodeLanguageFromElement(codeElement) {
      return getCodeLanguageFromElement(codeElement)
    },
    highlightCodeElement(codeElement) {
      highlightCodeElement(codeElement)
    },
    highlightAllCodeBlocks() {
      const doc = this.getEditorDocument()
      if (!doc) return
      highlightCodeBlocks(doc)
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
    normalizeEditorHtml(html) {
      const next = typeof html === 'string' ? html : html == null ? '' : String(html)
      return normalizeUeRichTextHtml(next)
    },
    getRawEditorContent() {
      if (!this.editor || typeof this.editor.getContent !== 'function') return ''
      return this.editor.getContent()
    },
    getPreviewContent(editor) {
      if (typeof this.lastEmittedValue === 'string') {
        return this.lastEmittedValue
      }
      if (typeof this.value === 'string') {
        return this.value
      }
      if (this.value == null) {
        const rawHtml = editor && typeof editor.getContent === 'function' ? editor.getContent() : ''
        return this.normalizeEditorHtml(rawHtml)
      }
      return String(this.value)
    },
    getPreviewDialogTitle(editor) {
      if (editor && typeof editor.getLang === 'function') {
        try {
          const title = editor.getLang('labelMap.preview')
          if (title) return title
        } catch (error) {}
      }
      return 'Preview'
    },
    getCloseDialogLabel(editor) {
      if (editor && typeof editor.getLang === 'function') {
        try {
          const label = editor.getLang('closeDialog')
          if (label) return label
        } catch (error) {}
      }
      return 'Close dialog'
    },
    ensurePreviewDialog() {
      if (this.previewDialog && document.body.contains(this.previewDialog)) {
        return this.previewDialog
      }

      const dialog = document.createElement('div')
      dialog.style.cssText = [
        'position:fixed',
        'inset:0',
        'z-index:9999',
        'display:none',
      ].join(';')
      dialog.innerHTML = `
        <div data-role="mask" style="position:absolute;inset:0;background:rgba(15,23,42,0.45);"></div>
        <div style="position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:100%;padding:24px;box-sizing:border-box;">
          <div style="display:flex;flex-direction:column;width:min(1100px,100%);height:min(85vh,100%);background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.2);">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #e5e7eb;font-size:16px;font-weight:600;color:#111827;">
              <span data-role="title">Preview</span>
              <button type="button" data-role="close" style="border:0;background:transparent;font-size:24px;line-height:1;cursor:pointer;color:#6b7280;">&times;</button>
            </div>
            <div data-role="content" class="ue-editor-preview__content" style="flex:1;min-height:0;overflow:auto;padding:24px;"></div>
          </div>
        </div>
      `
      dialog.addEventListener('click', (event) => {
        const target = event.target
        if (!(target instanceof Element)) return
        if (target.getAttribute('data-role') === 'mask' || target.getAttribute('data-role') === 'close') {
          this.closePreviewDialog()
        }
      })
      document.body.appendChild(dialog)
      this.previewDialog = dialog
      return dialog
    },
    destroyPreviewInstance() {
      if (!this.previewVm) return
      this.previewVm.$destroy()
      if (this.previewVm.$el && this.previewVm.$el.parentNode) {
        this.previewVm.$el.parentNode.removeChild(this.previewVm.$el)
      }
      this.previewVm = null
    },
    openPreviewDialog(html, editor) {
      const dialog = this.ensurePreviewDialog()
      const contentEl = dialog.querySelector('[data-role="content"]')
      const titleEl = dialog.querySelector('[data-role="title"]')
      const closeBtn = dialog.querySelector('[data-role="close"]')
      if (!(contentEl instanceof Element)) return
      if (titleEl instanceof Element) {
        titleEl.textContent = this.getPreviewDialogTitle(editor)
      }
      if (closeBtn instanceof HTMLButtonElement) {
        closeBtn.setAttribute('aria-label', this.getCloseDialogLabel(editor))
        closeBtn.title = this.getCloseDialogLabel(editor)
      }

      const nextHtml = typeof html === 'string' ? html : html == null ? '' : String(html)
      this.destroyPreviewInstance()
      contentEl.innerHTML = ''
      const mountPoint = document.createElement('div')
      contentEl.appendChild(mountPoint)
      const PreviewCtor = Vue.extend(UeRichTextPreview)
      this.previewVm = new PreviewCtor({
        propsData: {
          content: nextHtml,
        },
      })
      this.previewVm.$mount(mountPoint)

      if (!dialog.style.display || dialog.style.display === 'none') {
        this.previewBodyOverflow = document.body.style.overflow || ''
      }
      document.body.style.overflow = 'hidden'
      dialog.style.display = 'block'
      document.addEventListener('keydown', this.handlePreviewKeydown)
    },
    closePreviewDialog() {
      if (!this.previewDialog) return
      this.previewDialog.style.display = 'none'
      this.destroyPreviewInstance()
      document.body.style.overflow = this.previewBodyOverflow || ''
      document.removeEventListener('keydown', this.handlePreviewKeydown)
    },
    handlePreviewKeydown(event) {
      if (event && event.key === 'Escape') {
        this.closePreviewDialog()
      }
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
      if (typeof config.lang !== 'string') config.lang = ''
      if (typeof config.langPath !== 'string') config.langPath = ''
      if (!Array.isArray(config.iframeCssUrls)) config.iframeCssUrls = []

      config.iframeCssUrl = this.normalizeMaybeFunctionString(config.iframeCssUrl)
      config.iframeCssStyles = this.normalizeMaybeFunctionString(config.iframeCssStyles)
      config.lang = this.lang
      config.langPath = `${baseUrl}lang/`
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
      cacheLoadedLanguagePacks()
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
      const userToolbarCallback =
        typeof options.toolbarCallback === 'function' ? options.toolbarCallback : null
      options.toolbarCallback = (cmd, editor) => {
        if (userToolbarCallback && userToolbarCallback(cmd, editor) === true) {
          return true
        }
        if (String(cmd).toLowerCase() === 'preview') {
          this.openPreviewDialog(this.getPreviewContent(editor), editor)
          return true
        }
        return false
      }
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
      options.lang = this.lang
      options.langPath = `${this.getUeditorBaseUrl()}lang/`

      window.UEDITOR_CONFIG = {
        ...(window.UEDITOR_CONFIG || {}),
        ...options,
      }

      const previousI18N = setActiveLanguagePack(this.lang)
      this.editor = window.UE.getEditor(this.editorId, options)
      restoreLanguagePacks(previousI18N)
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
          const html = this.normalizeEditorHtml(this.getRawEditorContent())
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
        this.destroyPreviewInstance()
        if (this.previewDialog && this.previewDialog.parentNode) {
          this.previewDialog.parentNode.removeChild(this.previewDialog)
        }
        document.removeEventListener('keydown', this.handlePreviewKeydown)
        this.previewDialog = null
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
      return this.normalizeEditorHtml(this.getRawEditorContent())
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
