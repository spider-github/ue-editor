#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const assets = require('ueditor-plus-assets')

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Source directory not found: ${src}`)
  }
  fs.mkdirSync(dest, { recursive: true })
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

function run() {
  const [, , command, targetArg] = process.argv
  if (command !== 'copy-assets') {
    console.log('Usage: vue2-ueditor-plus copy-assets <target-dir>')
    process.exit(command ? 1 : 0)
  }

  if (!targetArg) {
    console.error('Missing target directory')
    process.exit(1)
  }

  const targetDir = path.resolve(process.cwd(), targetArg)
  copyDir(assets.assetRoot, targetDir)
  console.log(`UEditorPlus assets copied to ${targetDir}`)
}

run()
