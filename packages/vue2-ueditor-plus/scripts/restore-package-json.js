const fs = require('fs')
const path = require('path')

const pkgPath = path.join(__dirname, '..', 'package.json')
const backupPath = path.join(__dirname, '..', 'package.json.backup')

if (!fs.existsSync(backupPath)) {
  console.log('no package.json backup to restore')
  process.exit(0)
}

fs.copyFileSync(backupPath, pkgPath)
fs.unlinkSync(backupPath)
console.log('package.json restored after pack')
