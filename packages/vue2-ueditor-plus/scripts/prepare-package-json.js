const fs = require('fs')
const path = require('path')

const pkgPath = path.join(__dirname, '..', 'package.json')
const backupPath = path.join(__dirname, '..', 'package.json.backup')

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
fs.writeFileSync(backupPath, JSON.stringify(pkg, null, 2))

if (pkg.dependencies && pkg.dependencies['ueditor-plus-assets'] === 'workspace:*') {
  pkg.dependencies['ueditor-plus-assets'] = `^${pkg.version}`
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
console.log('package.json prepared for pack')
