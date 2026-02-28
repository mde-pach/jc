import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { detectEnvironment, detectProjectFramework, formatEnvironment } from './detect-environment.js'
import type { DetectedEnvironment } from './detect-environment.js'

// ── Test helpers ──────────────────────────────────────────────

let tmpDir: string

function writePkg(content: Record<string, unknown>): void {
  writeFileSync(join(tmpDir, 'package.json'), JSON.stringify(content))
}

function writeTsconfig(content: unknown): void {
  writeFileSync(join(tmpDir, 'tsconfig.json'), JSON.stringify(content))
}

function writeTsconfigRaw(content: string): void {
  writeFileSync(join(tmpDir, 'tsconfig.json'), content)
}

beforeEach(() => {
  tmpDir = join(
    '/tmp',
    `jc-detect-env-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
  mkdirSync(tmpDir, { recursive: true })
})

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

// ── detectEnvironment — framework ────────────────────────────

describe('detectEnvironment — framework detection', () => {
  it('detects Next.js from dependencies', () => {
    writePkg({ dependencies: { next: '^14.0.0', react: '^18.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.framework).toBe('next')
  })

  it('detects Next.js from devDependencies', () => {
    writePkg({ devDependencies: { next: '^14.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.framework).toBe('next')
  })

  it('detects Vite project', () => {
    writePkg({ devDependencies: { vite: '^5.0.0', react: '^18.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.framework).toBe('vite')
  })

  it('detects Remix project', () => {
    writePkg({ dependencies: { '@remix-run/react': '^2.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.framework).toBe('remix')
  })

  it('detects Create React App project', () => {
    writePkg({ dependencies: { 'react-scripts': '^5.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.framework).toBe('cra')
  })

  it('returns unknown when no known framework is found', () => {
    writePkg({ dependencies: { react: '^18.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.framework).toBe('unknown')
  })

  it('returns unknown when package.json is missing', () => {
    // No package.json written
    const env = detectEnvironment(tmpDir)
    expect(env.framework).toBe('unknown')
  })

  it('prioritizes Next.js over Vite when both are present', () => {
    writePkg({ dependencies: { next: '^14.0.0', vite: '^5.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.framework).toBe('next')
  })
})

// ── detectEnvironment — icon library ─────────────────────────

describe('detectEnvironment — icon library detection', () => {
  it('detects lucide-react', () => {
    writePkg({ dependencies: { 'lucide-react': '^0.400.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.iconLibrary).toBe('lucide')
  })

  it('detects @heroicons/react', () => {
    writePkg({ dependencies: { '@heroicons/react': '^2.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.iconLibrary).toBe('heroicons')
  })

  it('detects @phosphor-icons/react', () => {
    writePkg({ dependencies: { '@phosphor-icons/react': '^2.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.iconLibrary).toBe('phosphor')
  })

  it('detects @tabler/icons-react', () => {
    writePkg({ dependencies: { '@tabler/icons-react': '^3.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.iconLibrary).toBe('tabler')
  })

  it('detects react-icons', () => {
    writePkg({ dependencies: { 'react-icons': '^5.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.iconLibrary).toBe('react-icons')
  })

  it('returns null when no icon library is found', () => {
    writePkg({ dependencies: { react: '^18.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.iconLibrary).toBeNull()
  })
})

// ── detectEnvironment — design system ────────────────────────

describe('detectEnvironment — design system detection', () => {
  it('detects shadcn via components.json marker file', () => {
    writePkg({ dependencies: { react: '^18.0.0' } })
    writeFileSync(join(tmpDir, 'components.json'), JSON.stringify({ style: 'default' }))
    const env = detectEnvironment(tmpDir)
    expect(env.designSystem).toBe('shadcn')
  })

  it('detects radix via @radix-ui/react-dialog', () => {
    writePkg({ dependencies: { '@radix-ui/react-dialog': '^1.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.designSystem).toBe('radix')
  })

  it('detects radix via @radix-ui/themes', () => {
    writePkg({ dependencies: { '@radix-ui/themes': '^3.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.designSystem).toBe('radix')
  })

  it('detects chakra via @chakra-ui/react', () => {
    writePkg({ dependencies: { '@chakra-ui/react': '^2.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.designSystem).toBe('chakra')
  })

  it('detects mantine via @mantine/core', () => {
    writePkg({ dependencies: { '@mantine/core': '^7.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.designSystem).toBe('mantine')
  })

  it('detects mui via @mui/material', () => {
    writePkg({ dependencies: { '@mui/material': '^5.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.designSystem).toBe('mui')
  })

  it('detects ant design via antd', () => {
    writePkg({ dependencies: { antd: '^5.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.designSystem).toBe('ant')
  })

  it('returns null when no design system is found', () => {
    writePkg({ dependencies: { react: '^18.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.designSystem).toBeNull()
  })
})

// ── detectEnvironment — CSS framework ────────────────────────

describe('detectEnvironment — CSS framework detection', () => {
  it('detects tailwindcss', () => {
    writePkg({ devDependencies: { tailwindcss: '^4.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.cssFramework).toBe('tailwind')
  })

  it('detects styled-components', () => {
    writePkg({ dependencies: { 'styled-components': '^6.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.cssFramework).toBe('styled-components')
  })

  it('detects emotion via @emotion/react', () => {
    writePkg({ dependencies: { '@emotion/react': '^11.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.cssFramework).toBe('emotion')
  })

  it('returns null when no CSS framework is detected', () => {
    writePkg({ dependencies: { react: '^18.0.0' } })
    const env = detectEnvironment(tmpDir)
    expect(env.cssFramework).toBeNull()
  })
})

// ── detectEnvironment — srcDir ────────────────────────────────

describe('detectEnvironment — srcDir detection', () => {
  it('returns "src" when src/ directory exists', () => {
    writePkg({})
    mkdirSync(join(tmpDir, 'src'), { recursive: true })
    const env = detectEnvironment(tmpDir)
    expect(env.srcDir).toBe('src')
  })

  it('returns empty string when no src/ directory exists', () => {
    writePkg({})
    const env = detectEnvironment(tmpDir)
    expect(env.srcDir).toBe('')
  })
})

// ── detectEnvironment — path alias ───────────────────────────

describe('detectEnvironment — path alias detection', () => {
  it('returns default alias when no tsconfig.json exists', () => {
    writePkg({})
    const env = detectEnvironment(tmpDir)
    expect(env.pathAlias).toEqual({ '@/': 'src/' })
  })

  it('returns default alias when tsconfig has no paths', () => {
    writePkg({})
    writeTsconfig({ compilerOptions: { strict: true } })
    const env = detectEnvironment(tmpDir)
    expect(env.pathAlias).toEqual({ '@/': 'src/' })
  })

  it('parses @/* path alias from tsconfig', () => {
    writePkg({})
    writeTsconfig({
      compilerOptions: {
        paths: {
          '@/*': ['./src/*'],
        },
      },
    })
    const env = detectEnvironment(tmpDir)
    expect(env.pathAlias).toEqual({ '@/': 'src/' })
  })

  it('parses multiple path aliases from tsconfig', () => {
    writePkg({})
    writeTsconfig({
      compilerOptions: {
        paths: {
          '@/*': ['./src/*'],
          '~/*': ['./app/*'],
        },
      },
    })
    const env = detectEnvironment(tmpDir)
    expect(env.pathAlias['@/']).toBe('src/')
    expect(env.pathAlias['~/']).toBe('app/')
  })

  it('strips leading ./ from alias values', () => {
    writePkg({})
    writeTsconfig({
      compilerOptions: {
        paths: {
          'components/*': ['./src/components/*'],
        },
      },
    })
    const env = detectEnvironment(tmpDir)
    expect(env.pathAlias['components/']).toBe('src/components/')
  })

  it('handles tsconfig with line comments', () => {
    writePkg({})
    writeTsconfigRaw(`{
      // TypeScript configuration
      "compilerOptions": {
        // Enable strict mode
        "strict": true,
        "paths": {
          "@/*": ["./src/*"] // path alias
        }
      }
    }`)
    const env = detectEnvironment(tmpDir)
    expect(env.pathAlias).toEqual({ '@/': 'src/' })
  })

  it('handles tsconfig with block comments', () => {
    writePkg({})
    writeTsconfigRaw(`{
      /* Main tsconfig */
      "compilerOptions": {
        /* strict settings */
        "strict": true,
        "paths": {
          "@/*": ["./src/*"]
        }
      }
    }`)
    const env = detectEnvironment(tmpDir)
    expect(env.pathAlias).toEqual({ '@/': 'src/' })
  })

  it('handles tsconfig with both line and block comments', () => {
    writePkg({})
    writeTsconfigRaw(`{
      // Project config
      /* options */
      "compilerOptions": {
        "target": "es2017", // modern target
        /* path mappings for imports */
        "paths": {
          "@/*": ["./src/*"],
          "lib/*": ["./lib/*"] // utility alias
        }
      }
    }`)
    const env = detectEnvironment(tmpDir)
    expect(env.pathAlias['@/']).toBe('src/')
    expect(env.pathAlias['lib/']).toBe('lib/')
  })

  it('returns default alias when tsconfig paths is empty', () => {
    writePkg({})
    writeTsconfig({ compilerOptions: { paths: {} } })
    const env = detectEnvironment(tmpDir)
    expect(env.pathAlias).toEqual({ '@/': 'src/' })
  })

  it('reads path aliases from extended parent tsconfig', () => {
    writePkg({})
    const parentPath = join(tmpDir, 'tsconfig.base.json')
    writeFileSync(
      parentPath,
      JSON.stringify({
        compilerOptions: {
          paths: {
            '@/*': ['./src/*'],
          },
        },
      }),
    )
    writeTsconfig({ extends: './tsconfig.base.json', compilerOptions: { strict: true } })
    const env = detectEnvironment(tmpDir)
    expect(env.pathAlias).toEqual({ '@/': 'src/' })
  })
})

// ── detectEnvironment — full Next.js project ─────────────────

describe('detectEnvironment — full Next.js project snapshot', () => {
  it('detects a typical Next.js + Tailwind + Lucide + shadcn setup', () => {
    writeFileSync(join(tmpDir, 'components.json'), JSON.stringify({ style: 'default' }))
    mkdirSync(join(tmpDir, 'src'), { recursive: true })
    writePkg({
      dependencies: {
        next: '^14.0.0',
        react: '^18.0.0',
        'lucide-react': '^0.400.0',
        '@radix-ui/react-dialog': '^1.0.0',
      },
      devDependencies: {
        tailwindcss: '^3.0.0',
        typescript: '^5.0.0',
      },
    })
    writeTsconfig({
      compilerOptions: {
        paths: { '@/*': ['./src/*'] },
      },
    })

    const env = detectEnvironment(tmpDir)

    expect(env.framework).toBe('next')
    expect(env.cssFramework).toBe('tailwind')
    expect(env.iconLibrary).toBe('lucide')
    expect(env.designSystem).toBe('shadcn')
    expect(env.pathAlias).toEqual({ '@/': 'src/' })
    expect(env.srcDir).toBe('src')
  })
})

// ── formatEnvironment ─────────────────────────────────────────

describe('formatEnvironment', () => {
  it('formats a minimal environment with only framework', () => {
    const env: DetectedEnvironment = {
      framework: 'unknown',
      iconLibrary: null,
      designSystem: null,
      cssFramework: null,
      pathAlias: {},
      srcDir: '',
    }
    expect(formatEnvironment(env)).toBe('React')
  })

  it('formats Next.js framework', () => {
    const env: DetectedEnvironment = {
      framework: 'next',
      iconLibrary: null,
      designSystem: null,
      cssFramework: null,
      pathAlias: {},
      srcDir: 'src',
    }
    expect(formatEnvironment(env)).toBe('Next.js')
  })

  it('formats Vite framework', () => {
    const env: DetectedEnvironment = {
      framework: 'vite',
      iconLibrary: null,
      designSystem: null,
      cssFramework: null,
      pathAlias: {},
      srcDir: '',
    }
    expect(formatEnvironment(env)).toBe('Vite')
  })

  it('formats Remix framework', () => {
    const env: DetectedEnvironment = {
      framework: 'remix',
      iconLibrary: null,
      designSystem: null,
      cssFramework: null,
      pathAlias: {},
      srcDir: '',
    }
    expect(formatEnvironment(env)).toBe('Remix')
  })

  it('formats Create React App framework', () => {
    const env: DetectedEnvironment = {
      framework: 'cra',
      iconLibrary: null,
      designSystem: null,
      cssFramework: null,
      pathAlias: {},
      srcDir: '',
    }
    expect(formatEnvironment(env)).toBe('Create React App')
  })

  it('formats Next.js + Tailwind', () => {
    const env: DetectedEnvironment = {
      framework: 'next',
      iconLibrary: null,
      designSystem: null,
      cssFramework: 'tailwind',
      pathAlias: {},
      srcDir: 'src',
    }
    expect(formatEnvironment(env)).toBe('Next.js + Tailwind')
  })

  it('formats Next.js + Tailwind + Lucide', () => {
    const env: DetectedEnvironment = {
      framework: 'next',
      iconLibrary: 'lucide',
      designSystem: null,
      cssFramework: 'tailwind',
      pathAlias: {},
      srcDir: 'src',
    }
    expect(formatEnvironment(env)).toBe('Next.js + Tailwind + Lucide')
  })

  it('formats Next.js + Tailwind + Lucide + shadcn', () => {
    const env: DetectedEnvironment = {
      framework: 'next',
      iconLibrary: 'lucide',
      designSystem: 'shadcn',
      cssFramework: 'tailwind',
      pathAlias: { '@/': 'src/' },
      srcDir: 'src',
    }
    expect(formatEnvironment(env)).toBe('Next.js + Tailwind + Lucide + shadcn')
  })

  it('formats Vite + styled-components + Heroicons + Radix', () => {
    const env: DetectedEnvironment = {
      framework: 'vite',
      iconLibrary: 'heroicons',
      designSystem: 'radix',
      cssFramework: 'styled-components',
      pathAlias: {},
      srcDir: 'src',
    }
    expect(formatEnvironment(env)).toBe('Vite + styled-components + Heroicons + Radix')
  })

  it('formats Vite + Emotion + Phosphor + MUI', () => {
    const env: DetectedEnvironment = {
      framework: 'vite',
      iconLibrary: 'phosphor',
      designSystem: 'mui',
      cssFramework: 'emotion',
      pathAlias: {},
      srcDir: '',
    }
    expect(formatEnvironment(env)).toBe('Vite + Emotion + Phosphor + MUI')
  })

  it('formats all icon library names correctly', () => {
    const libraries: Array<[DetectedEnvironment['iconLibrary'], string]> = [
      ['lucide', 'Lucide'],
      ['heroicons', 'Heroicons'],
      ['phosphor', 'Phosphor'],
      ['react-icons', 'react-icons'],
      ['tabler', 'Tabler'],
    ]
    for (const [iconLibrary, expected] of libraries) {
      const env: DetectedEnvironment = {
        framework: 'unknown',
        iconLibrary,
        designSystem: null,
        cssFramework: null,
        pathAlias: {},
        srcDir: '',
      }
      expect(formatEnvironment(env)).toContain(expected)
    }
  })

  it('formats all design system names correctly', () => {
    const systems: Array<[DetectedEnvironment['designSystem'], string]> = [
      ['shadcn', 'shadcn'],
      ['radix', 'Radix'],
      ['chakra', 'Chakra UI'],
      ['mantine', 'Mantine'],
      ['mui', 'MUI'],
      ['ant', 'Ant Design'],
    ]
    for (const [designSystem, expected] of systems) {
      const env: DetectedEnvironment = {
        framework: 'unknown',
        iconLibrary: null,
        designSystem,
        cssFramework: null,
        pathAlias: {},
        srcDir: '',
      }
      expect(formatEnvironment(env)).toContain(expected)
    }
  })

  it('uses + as separator between all parts', () => {
    const env: DetectedEnvironment = {
      framework: 'next',
      iconLibrary: 'lucide',
      designSystem: 'shadcn',
      cssFramework: 'tailwind',
      pathAlias: {},
      srcDir: 'src',
    }
    const result = formatEnvironment(env)
    const parts = result.split(' + ')
    expect(parts).toHaveLength(4)
  })
})

// ── detectProjectFramework ────────────────────────────────────

describe('detectProjectFramework', () => {
  it('returns next for Next.js projects', () => {
    writePkg({ dependencies: { next: '^14.0.0' } })
    expect(detectProjectFramework(tmpDir)).toBe('next')
  })

  it('returns react for non-Next.js projects', () => {
    writePkg({ dependencies: { react: '^18.0.0' } })
    expect(detectProjectFramework(tmpDir)).toBe('react')
  })

  it('returns react when no package.json exists', () => {
    expect(detectProjectFramework(tmpDir)).toBe('react')
  })
})
