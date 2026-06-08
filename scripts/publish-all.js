const { spawnSync } = require('child_process')
const path = require('path')

const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d')

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
  const args = ['publish', '--access', 'public']

  if (isDryRun) {
    console.log(`[Dry Run] Would run: npm ${args.join(' ')} (cwd: ${pkg.dir})`)
    return
  }

  const result = spawnSync('npm', args, {
    cwd: pkg.dir,
    stdio: 'inherit',
    shell: true,
  })

  if (result.status !== 0) {
    throw new Error(`Publish failed: ${pkg.name}`)
  }
}

function checkAuth() {
  if (isDryRun) {
    console.log('Checking npm authentication... [Skipped in Dry Run]')
    return
  }
  console.log('Checking npm authentication...')
  const result = spawnSync('npm', ['whoami', '--registry', 'https://registry.npmjs.org/'], {
    shell: true,
  })
  if (result.status !== 0) {
    console.error('\nError: You must be logged in to npm to publish packages.')
    console.error('Run the following command to log in to the official registry:')
    console.error('  npm login --registry https://registry.npmjs.org/')
    process.exit(1)
  }
  console.log(`Logged in as: ${result.stdout.toString().trim()}`)
}

function main() {
  if (isDryRun) {
    console.log('--- DRY RUN MODE ENABLED ---')
  }
  checkAuth()
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
