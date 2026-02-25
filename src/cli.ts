/**
 * jc CLI — extract component metadata
 *
 * Usage:
 *   npx jc extract                    # Uses jc.config.ts or defaults
 *   npx jc extract --config path.ts   # Custom config file
 *   npx jc extract --watch            # Re-extract on file changes
 *   npx jc extract --json             # Output machine-readable JSON to stdout
 *   npx jc extract --verbose          # Show detailed extraction info
 */

import { existsSync, watch } from 'node:fs'
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
        console.log(`[jc] Config loaded from ${candidate.replace(`${projectRoot}/`, '')}`)
        return mod.default ?? mod
      } catch (err) {
        console.warn(`[jc] Failed to load config ${candidate}: ${err}`)
      }
    }
  }

  console.log('[jc] No config file found, using defaults')
  return {}
}

interface RunOptions {
  json?: boolean
  verbose?: boolean
}

function runExtract(projectRoot: string, config: JcConfig, options: RunOptions = {}): void {
  try {
    const result = extract(projectRoot, config)

    if (options.json) {
      // Machine-readable output for CI
      const output = {
        components: result.meta.components.map((c) => ({
          name: c.displayName,
          file: c.filePath,
          props: Object.keys(c.props).length,
          exportType: c.exportType ?? 'named',
          acceptsChildren: c.acceptsChildren,
          childrenType: c.childrenType,
        })),
        warnings: result.warnings,
        stats: result.stats,
      }
      process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
    }

    if (options.verbose && result.warnings.length > 0) {
      console.log('\n[jc] Warnings:')
      for (const w of result.warnings) {
        switch (w.type) {
          case 'FILE_PARSE_ERROR':
            console.log(`  ✗ ${w.file}: ${w.error}`)
            break
          case 'FILE_SKIPPED':
            console.log(`  ○ ${w.file}: ${w.reason}`)
            break
          case 'PROP_FALLBACK':
            console.log(`  △ ${w.component}.${w.prop}: fell back to ${w.from} detection`)
            break
          case 'COMPONENT_SKIPPED':
            console.log(`  ○ ${w.component}: ${w.reason}`)
            break
        }
      }
      console.log('')
    }

    writeOutput(projectRoot, config, result.meta)
  } catch (err) {
    console.error(`[jc] Extraction failed: ${err}`)
    process.exit(1)
  }
}

function startWatch(projectRoot: string, config: JcConfig, options: RunOptions): void {
  // Resolve the component directory from the glob pattern
  const globBase = config.componentGlob.split('*')[0].replace(/\/$/, '') || '.'
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
      runExtract(projectRoot, config, options)
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
    const jsonMode = args.includes('--json')
    const verboseMode = args.includes('--verbose') || args.includes('-v')
    const projectRoot = process.cwd()

    const userConfig = await loadConfig(projectRoot, configPath)
    const config = resolveConfig(userConfig)

    const options: RunOptions = { json: jsonMode, verbose: verboseMode }

    console.log(`[jc] Extracting from ${config.componentGlob}`)
    runExtract(projectRoot, config, options)

    if (watchMode) {
      startWatch(projectRoot, config, options)
    }
  } else if (command === '--help' || command === '-h') {
    console.log(`
jc — just-components showcase toolkit

Commands:
  extract              Extract component metadata and generate registry
    --config <path>    Path to config file (default: jc.config.ts)
    --watch, -w        Re-extract on file changes
    --json             Output machine-readable JSON to stdout
    --verbose, -v      Show detailed extraction warnings

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
