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

let languagesRegistered = false

function registerLanguage(name, loader) {
  if (typeof hljs.getLanguage === 'function' && hljs.getLanguage(name)) return
  hljs.registerLanguage(name, loader)
}

export function ensureUeRichTextLanguages() {
  if (languagesRegistered) return hljs

  registerLanguage('java', java)
  registerLanguage('xml', xml)
  registerLanguage('html', xml)
  registerLanguage('javascript', javascript)
  registerLanguage('typescript', typescript)
  registerLanguage('json', json)
  registerLanguage('php', php)
  registerLanguage('css', css)
  registerLanguage('sql', sql)
  registerLanguage('bash', bash)
  registerLanguage('python', python)
  registerLanguage('go', go)
  registerLanguage('rust', rust)
  registerLanguage('plaintext', plaintext)
  registerLanguage('powershell', powershell)
  registerLanguage('csharp', cs)
  registerLanguage('nginx', nginx)
  registerLanguage('markdown', markdown)

  languagesRegistered = true
  return hljs
}

export function normalizeUeCodeLanguage(lang) {
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

export function isElementNode(node) {
  return !!node && node.nodeType === 1
}

export function extractCodeText(node) {
  if (!node) return ''
  if (node.nodeType === 3) {
    return node.nodeValue || ''
  }
  if (node.nodeType !== 1) {
    return ''
  }
  const tagName = node.tagName ? node.tagName.toUpperCase() : ''
  if (tagName === 'BR') {
    return '\n'
  }

  let text = ''
  const childNodes = node.childNodes ? Array.from(node.childNodes) : []
  childNodes.forEach((childNode) => {
    text += extractCodeText(childNode)
  })
  return text
}

export function getCodeLanguageFromElement(codeElement) {
  if (!isElementNode(codeElement)) return ''
  const dataLang = codeElement.getAttribute('data-code-lang')
  if (dataLang) return normalizeUeCodeLanguage(dataLang)

  const className = codeElement.className || ''
  let match = String(className).match(/(?:^|\s)language-([^\s]+)/)
  if (match && match[1]) return normalizeUeCodeLanguage(match[1])

  match = String(className).match(/brush:([^;]+)/)
  return match && match[1] ? normalizeUeCodeLanguage(match[1]) : ''
}

export function applyCodeLanguageAttributes(codeElement, language) {
  if (!isElementNode(codeElement)) return
  const normalizedLanguage = normalizeUeCodeLanguage(language)
  const preElement = typeof codeElement.closest === 'function' ? codeElement.closest('pre') : null

  codeElement.setAttribute('data-code-lang', normalizedLanguage || '')
  codeElement.className = normalizedLanguage ? `language-${normalizedLanguage}` : ''

  if (isElementNode(preElement)) {
    preElement.setAttribute('data-code-lang', normalizedLanguage || '')
    preElement.className = normalizedLanguage ? `language-${normalizedLanguage}` : ''
  }
}

export function highlightCodeElement(codeElement) {
  if (!isElementNode(codeElement)) return

  ensureUeRichTextLanguages()

  const rawText = extractCodeText(codeElement)
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
  const language = getCodeLanguageFromElement(codeElement)

  applyCodeLanguageAttributes(codeElement, language)
  codeElement.textContent = rawText

  if (!rawText) return

  if (language && typeof hljs.getLanguage === 'function' && hljs.getLanguage(language)) {
    if (typeof hljs.highlightElement === 'function') {
      hljs.highlightElement(codeElement)
    } else if (typeof hljs.highlightBlock === 'function') {
      hljs.highlightBlock(codeElement)
    }
  }
}

export function highlightCodeBlocks(root) {
  if (!root || typeof root.querySelectorAll !== 'function') return
  ensureUeRichTextLanguages()
  root.querySelectorAll('pre code').forEach((codeElement) => {
    highlightCodeElement(codeElement)
  })
}

export function restoreCopiedCodeBlocksHtml(html) {
  if (typeof html !== 'string' || !html) return html
  const div = document.createElement('div')
  div.innerHTML = html

  div.querySelectorAll('pre code').forEach((codeElement) => {
    if (!isElementNode(codeElement)) return
    const preElement = typeof codeElement.closest === 'function' ? codeElement.closest('pre') : null
    const encodedRawCode =
      codeElement.getAttribute('data-raw-code') ||
      (isElementNode(preElement) ? preElement.getAttribute('data-raw-code') : '') ||
      ''
    if (!encodedRawCode) return

    let rawText = ''
    try {
      rawText = decodeURIComponent(encodedRawCode)
    } catch (error) {
      rawText = ''
    }
    if (!rawText) return

    const language = getCodeLanguageFromElement(codeElement)
    codeElement.textContent = rawText
    applyCodeLanguageAttributes(codeElement, language)
    codeElement.removeAttribute('data-raw-code')

    if (isElementNode(preElement)) {
      preElement.removeAttribute('data-raw-code')
    }
  })

  return div.innerHTML
}

export function buildUeRichTextRenderStyles(scopeSelector = 'body') {
  const scope = String(scopeSelector || 'body').trim() || 'body'

  return `
${scope} {
  color: inherit;
  background: transparent;
  line-height: 1.6;
  word-break: break-word;
}

${scope} p,
${scope} h1,
${scope} h2,
${scope} h3,
${scope} h4,
${scope} h5,
${scope} h6,
${scope} table,
${scope} pre,
${scope} blockquote,
${scope} ul,
${scope} ol,
${scope} hr {
  margin: 10px 0;
}

${scope} blockquote {
  display: block;
  padding: 5px 10px;
  background-color: #f8fafc;
  border-left: 4px solid #d0e5f2;
}

${scope} :not(pre) > code,
${scope} p code,
${scope} li code,
${scope} td code,
${scope} th code,
${scope} blockquote code {
  display: inline-block;
  margin: 0 3px;
  padding: 3px 6px;
  color: inherit;
  background-color: #f3f4f6;
  border-radius: 4px;
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 0.92em;
}

${scope} pre {
  padding: 0;
  overflow-x: auto;
  background: transparent;
  border-radius: 8px;
  white-space: pre;
  box-sizing: border-box;
}

${scope} pre > code,
${scope} pre > code.hljs {
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

${scope} pre > code.hljs {
  color: #383a42;
  background: #fafafa;
}

${scope} pre > code .hljs-comment,
${scope} pre > code .hljs-quote {
  color: #a0a1a7;
  font-style: italic;
}

${scope} pre > code .hljs-doctag,
${scope} pre > code .hljs-keyword,
${scope} pre > code .hljs-formula {
  color: #a626a4;
}

${scope} pre > code .hljs-section,
${scope} pre > code .hljs-name,
${scope} pre > code .hljs-selector-tag,
${scope} pre > code .hljs-deletion,
${scope} pre > code .hljs-subst {
  color: #e45649;
}

${scope} pre > code .hljs-literal,
${scope} pre > code .hljs-string,
${scope} pre > code .hljs-regexp,
${scope} pre > code .hljs-addition,
${scope} pre > code .hljs-attribute,
${scope} pre > code .hljs-meta .hljs-string {
  color: #50a14f;
}

${scope} pre > code .hljs-attr,
${scope} pre > code .hljs-variable,
${scope} pre > code .hljs-template-variable,
${scope} pre > code .hljs-type,
${scope} pre > code .hljs-selector-class,
${scope} pre > code .hljs-selector-attr,
${scope} pre > code .hljs-selector-pseudo,
${scope} pre > code .hljs-number {
  color: #986801;
}

${scope} pre > code .hljs-symbol,
${scope} pre > code .hljs-bullet,
${scope} pre > code .hljs-link,
${scope} pre > code .hljs-meta,
${scope} pre > code .hljs-selector-id,
${scope} pre > code .hljs-title {
  color: #4078f2;
}

${scope} pre > code .hljs-built_in,
${scope} pre > code .hljs-title.class_,
${scope} pre > code .hljs-class .hljs-title {
  color: #c18401;
}

${scope} pre > code .hljs-emphasis {
  font-style: italic;
}

${scope} pre > code .hljs-strong {
  font-weight: 700;
}

${scope} a {
  color: #0d6efd;
  text-decoration: none;
  cursor: pointer;
  word-break: break-word;
}

${scope} a:hover,
${scope} a:focus {
  text-decoration: underline;
}

${scope} img {
  max-width: 100%;
}

${scope} table {
  caption-side: bottom;
  border-collapse: collapse;
  display: table;
  margin-bottom: 10px;
}

${scope} table td,
${scope} table th {
  padding: 5px 10px;
  border: 1px solid #DDD;
  vertical-align: top;
}

${scope} table th {
  text-align: center;
}

${scope} table.noBorderTable td,
${scope} table.noBorderTable th,
${scope} table.noBorderTable caption {
  border: 1px dashed #ddd !important;
}

${scope} table tr.firstRow th,
${scope} table tr.firstRow td {
  background-color: #f8fafc;
}

${scope} ul,
${scope} ol {
  padding-left: 32px;
}

${scope} hr {
  color: inherit;
  border: 0;
  border-top: 1px solid;
  opacity: 0.25;
}
`
}

ensureUeRichTextLanguages()
