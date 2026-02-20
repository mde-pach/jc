/**
 * jc CLI — extract component metadata
 *
 * Usage:
 *   npx jc extract                    # Uses jc.config.ts or defaults
 *   npx jc extract --config path.ts   # Custom config file
 */

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
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

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command || command === 'extract') {
    const configFlagIdx = args.indexOf('--config')
    const configPath = configFlagIdx >= 0 ? args[configFlagIdx + 1] : undefined
    const projectRoot = process.cwd()

    const userConfig = await loadConfig(projectRoot, configPath)
    const config = resolveConfig(userConfig)

    console.log(`[jc] Extracting from ${config.componentGlob}`)
    const meta = extract(projectRoot, config)
    writeOutput(projectRoot, config, meta)
  } else if (command === '--help' || command === '-h') {
    console.log(`
jc — just-components showcase toolkit

Commands:
  extract              Extract component metadata and generate registry
    --config <path>    Path to config file (default: jc.config.ts)

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
