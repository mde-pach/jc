/**
 * Environment detection — reads package.json + tsconfig.json to detect
 * the project's framework, icon library, design system, CSS framework,
 * path aliases, and source directory.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// ── Types ────────────────────────────────────────────────────

export interface DetectedEnvironment {
  framework: 'next' | 'vite' | 'remix' | 'cra' | 'unknown'
  iconLibrary: 'lucide' | 'heroicons' | 'phosphor' | 'react-icons' | 'tabler' | null
  designSystem: 'shadcn' | 'radix' | 'chakra' | 'mantine' | 'mui' | 'ant' | null
  cssFramework: 'tailwind' | 'css-modules' | 'styled-components' | 'emotion' | null
  pathAlias: Record<string, string>
  srcDir: 'src' | ''
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Strip JSON5-style comments (// and /* ... *\/) so JSON.parse works
 * on tsconfig.json files with comments.
 */
function stripJsonComments(text: string): string {
  let result = ''
  let i = 0
  let inString = false
  let stringChar = ''

  while (i < text.length) {
    if (inString) {
      if (text[i] === '\\') {
        result += text[i] + (text[i + 1] ?? '')
        i += 2
        continue
      }
      if (text[i] === stringChar) {
        inString = false
      }
      result += text[i]
      i++
      continue
    }

    // Start of string
    if (text[i] === '"' || text[i] === "'") {
      inString = true
      stringChar = text[i]
      result += text[i]
      i++
      continue
    }

    // Line comment
    if (text[i] === '/' && text[i + 1] === '/') {
      // Skip until end of line
      while (i < text.length && text[i] !== '\n') i++
      continue
    }

    // Block comment
    if (text[i] === '/' && text[i + 1] === '*') {
      i += 2
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
      i += 2 // skip */
      continue
    }

    result += text[i]
    i++
  }

  return result
}

/** Read and parse a JSON file, returning null on failure */
function readJson(path: string): Record<string, unknown> | null {
  try {
    const raw = readFileSync(path, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** Read and parse a JSON file that may contain comments (e.g. tsconfig.json) */
function readJsonWithComments(path: string): Record<string, unknown> | null {
  try {
    const raw = readFileSync(path, 'utf-8')
    return JSON.parse(stripJsonComments(raw))
  } catch {
    return null
  }
}

/** Check if a dependency exists in deps or devDeps */
function hasDep(pkg: Record<string, unknown>, name: string): boolean {
  const deps = pkg.dependencies as Record<string, string> | undefined
  const devDeps = pkg.devDependencies as Record<string, string> | undefined
  return !!(deps?.[name] || devDeps?.[name])
}

// ── Detection logic ──────────────────────────────────────────

function detectFramework(
  pkg: Record<string, unknown>,
): DetectedEnvironment['framework'] {
  if (hasDep(pkg, 'next')) return 'next'
  if (hasDep(pkg, '@remix-run/react')) return 'remix'
  if (hasDep(pkg, 'vite')) return 'vite'
  if (hasDep(pkg, 'react-scripts')) return 'cra'
  return 'unknown'
}

function detectIconLibrary(
  pkg: Record<string, unknown>,
): DetectedEnvironment['iconLibrary'] {
  if (hasDep(pkg, 'lucide-react')) return 'lucide'
  if (hasDep(pkg, '@heroicons/react')) return 'heroicons'
  if (hasDep(pkg, '@phosphor-icons/react')) return 'phosphor'
  if (hasDep(pkg, '@tabler/icons-react')) return 'tabler'
  if (hasDep(pkg, 'react-icons')) return 'react-icons'
  return null
}

function detectDesignSystem(
  projectRoot: string,
  pkg: Record<string, unknown>,
): DetectedEnvironment['designSystem'] {
  // shadcn uses a components.json marker file
  if (existsSync(join(projectRoot, 'components.json'))) return 'shadcn'
  if (hasDep(pkg, '@radix-ui/react-dialog') || hasDep(pkg, '@radix-ui/themes')) return 'radix'
  if (hasDep(pkg, '@chakra-ui/react')) return 'chakra'
  if (hasDep(pkg, '@mantine/core')) return 'mantine'
  if (hasDep(pkg, '@mui/material')) return 'mui'
  if (hasDep(pkg, 'antd')) return 'ant'
  return null
}

function detectCssFramework(
  pkg: Record<string, unknown>,
): DetectedEnvironment['cssFramework'] {
  if (hasDep(pkg, 'tailwindcss')) return 'tailwind'
  if (hasDep(pkg, 'styled-components')) return 'styled-components'
  if (hasDep(pkg, '@emotion/react')) return 'emotion'
  // css-modules is implicit (no dependency) — can't reliably detect
  return null
}

/**
 * Parse tsconfig.json paths into a flat alias map.
 * e.g. `{ "@/*": ["./src/*"] }` → `{ "@/": "src/" }`
 */
function detectPathAlias(projectRoot: string): Record<string, string> {
  const tsconfigPath = join(projectRoot, 'tsconfig.json')
  const tsconfig = readJsonWithComments(tsconfigPath)
  if (!tsconfig) return { '@/': 'src/' }

  const compilerOptions = tsconfig.compilerOptions as Record<string, unknown> | undefined
  const paths = compilerOptions?.paths as Record<string, string[]> | undefined

  if (!paths || Object.keys(paths).length === 0) {
    // Try extends — read the parent config
    const extendsPath = tsconfig.extends as string | undefined
    if (extendsPath) {
      const parentPath = join(projectRoot, extendsPath)
      const parent = readJsonWithComments(
        parentPath.endsWith('.json') ? parentPath : `${parentPath}.json`,
      )
      const parentOptions = (parent?.compilerOptions as Record<string, unknown>)?.paths as
        | Record<string, string[]>
        | undefined
      if (parentOptions) {
        return parsePaths(parentOptions)
      }
    }
    return { '@/': 'src/' }
  }

  return parsePaths(paths)
}

function parsePaths(paths: Record<string, string[]>): Record<string, string> {
  const alias: Record<string, string> = {}
  for (const [key, values] of Object.entries(paths)) {
    if (!values || values.length === 0) continue
    // Strip trailing * and leading ./
    const aliasKey = key.replace(/\*$/, '')
    const aliasValue = values[0].replace(/^\.\/?/, '').replace(/\*$/, '')
    alias[aliasKey] = aliasValue
  }
  return Object.keys(alias).length > 0 ? alias : { '@/': 'src/' }
}

// ── Public helpers ────────────────────────────────────────────

/** Simple framework detection from package.json — returns 'next' | 'react' for pipeline use */
export function detectProjectFramework(projectRoot: string): 'next' | 'react' {
  const pkg = readJson(join(projectRoot, 'package.json')) ?? {}
  return hasDep(pkg, 'next') ? 'next' : 'react'
}

// ── Main detection ───────────────────────────────────────────

export function detectEnvironment(projectRoot: string): DetectedEnvironment {
  const pkgPath = join(projectRoot, 'package.json')
  const pkg = readJson(pkgPath) ?? {}

  return {
    framework: detectFramework(pkg),
    iconLibrary: detectIconLibrary(pkg),
    designSystem: detectDesignSystem(projectRoot, pkg),
    cssFramework: detectCssFramework(pkg),
    pathAlias: detectPathAlias(projectRoot),
    srcDir: existsSync(join(projectRoot, 'src')) ? 'src' : '',
  }
}

/**
 * Format environment for logging. Returns a compact summary string.
 * e.g. "Next.js + Tailwind + Lucide + shadcn"
 */
export function formatEnvironment(env: DetectedEnvironment): string {
  const parts: string[] = []

  const frameworkNames: Record<string, string> = {
    next: 'Next.js',
    vite: 'Vite',
    remix: 'Remix',
    cra: 'Create React App',
    unknown: 'React',
  }
  parts.push(frameworkNames[env.framework])

  if (env.cssFramework) {
    const cssNames: Record<string, string> = {
      tailwind: 'Tailwind',
      'styled-components': 'styled-components',
      emotion: 'Emotion',
      'css-modules': 'CSS Modules',
    }
    parts.push(cssNames[env.cssFramework] ?? env.cssFramework)
  }

  if (env.iconLibrary) {
    const iconNames: Record<string, string> = {
      lucide: 'Lucide',
      heroicons: 'Heroicons',
      phosphor: 'Phosphor',
      'react-icons': 'react-icons',
      tabler: 'Tabler',
    }
    parts.push(iconNames[env.iconLibrary] ?? env.iconLibrary)
  }

  if (env.designSystem) {
    const dsNames: Record<string, string> = {
      shadcn: 'shadcn',
      radix: 'Radix',
      chakra: 'Chakra UI',
      mantine: 'Mantine',
      mui: 'MUI',
      ant: 'Ant Design',
    }
    parts.push(dsNames[env.designSystem] ?? env.designSystem)
  }

  return parts.join(' + ')
}
