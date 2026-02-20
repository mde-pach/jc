/**
 * jc CLI — extract component metadata
 *
 * Usage:
 *   npx jc extract                    # Uses jc.config.ts or defaults
 *   npx jc extract --config path.ts   # Custom config file
 *   npx jc extract --watch            # Re-extract on file changes
 */

import { existsSync, watch } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { resolveConfig } from './config.js'
import { extract, writeOutput } from './extract/extract.js'
import type { JcConfig } from './types.js'

async function loadConfig(projectRoot: string, configPath?: string): Promise<Partial<JcConfig>> {
  const candidates = configPath
    ? [resolve(projectRoot, configPath)]
    : [
        resolve(projectRoot, 'jc.config.ts'),
        resolve(projectRoot, 'jc.config.js'),
        resolve(projectRoot, 'jc.config.mjs'),
      ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      try {
        // Use dynamic import with file URL for cross-platform compat
        const mod = await import(pathToFileURL(candidate).href)
        console.log(`[jc] Config loaded from ${candidate.replace(projectRoot + '/', '')}`)
        return mod.default ?? mod
      } catch (err) {
        console.warn(`[jc] Failed to load config ${candidate}: ${err}`)
      }
    }
  }

  console.log('[jc] No config file found, using defaults')
  return {}
}

function runExtract(projectRoot: string, config: JcConfig): void {
  try {
    const meta = extract(projectRoot, config)
    writeOutput(projectRoot, config, meta)
  } catch (err) {
    console.error(`[jc] Extraction failed: ${err}`)
  }
}

function startWatch(projectRoot: string, config: JcConfig): void {
  // Resolve the component directory from the glob pattern
  const globBase = config.componentGlob.split('*')[0].replace(/\/$/, '')
  const watchDir = resolve(projectRoot, globBase)

  if (!existsSync(watchDir)) {
    console.error(`[jc] Watch directory does not exist: ${watchDir}`)
    process.exit(1)
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  console.log(`[jc] Watching ${globBase} for changes...`)

  watch(watchDir, { recursive: true }, (_event, filename) => {
    if (!filename || !filename.endsWith('.tsx')) return

    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      const time = new Date().toLocaleTimeString()
      console.log(`\n[jc] ${time} — change detected: ${filename}`)
      runExtract(projectRoot, config)
    }, 200)
  })
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command || command === 'extract') {
    const configFlagIdx = args.indexOf('--config')
    const configPath = configFlagIdx >= 0 ? args[configFlagIdx + 1] : undefined
    const watchMode = args.includes('--watch') || args.includes('-w')
    const projectRoot = process.cwd()

    const userConfig = await loadConfig(projectRoot, configPath)
    const config = resolveConfig(userConfig)

    console.log(`[jc] Extracting from ${config.componentGlob}`)
    runExtract(projectRoot, config)

    if (watchMode) {
      startWatch(projectRoot, config)
    }
  } else if (command === '--help' || command === '-h') {
    console.log(`
jc — just-components showcase toolkit

Commands:
  extract              Extract component metadata and generate registry
    --config <path>    Path to config file (default: jc.config.ts)
    --watch, -w        Re-extract on file changes

Configuration:
  Create a jc.config.ts at your project root:

    import { defineConfig } from 'jc/config'

    export default defineConfig({
      componentGlob: 'src/components/ui/**/*.tsx',
      outputDir: 'src/jc/generated',
    })
`)
  } else {
    console.error(`[jc] Unknown command: ${command}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('[jc] Fatal error:', err)
  process.exit(1)
})
