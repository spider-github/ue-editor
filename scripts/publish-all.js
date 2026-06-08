const { spawnSync } = require('child_process')
const path = require('path')

const rootDir = process.cwd()
const packages = [
  {
    name: 'ueditor-plus-assets',
    dir: path.join(rootDir, 'packages', 'ueditor-plus-assets'),
  },
  {
    name: 'vue2-ueditor-plus-editor',
    dir: path.join(rootDir, 'packages', 'vue2-ueditor-plus'),
  },
]

function runPublish(pkg) {
  console.log(`\nPublishing ${pkg.name} ...`)
  const result = spawnSync('npm', ['publish', '--access', 'public'], {
    cwd: pkg.dir,
    stdio: 'inherit',
    shell: true,
  })

  if (result.status !== 0) {
    throw new Error(`Publish failed: ${pkg.name}`)
  }
}

function main() {
  console.log('Publishing packages in order:')
  packages.forEach((pkg, index) => {
    console.log(`${index + 1}. ${pkg.name}`)
  })

  for (const pkg of packages) {
    runPublish(pkg)
  }

  console.log('\nAll packages published successfully.')
}

try {
  main()
} catch (error) {
  console.error(`\n${error.message}`)
  process.exit(1)
}
