import { createHighlighterCoreSync } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import tsx from 'shiki/langs/tsx.mjs'
import bash from 'shiki/langs/bash.mjs'
import ts from 'shiki/langs/typescript.mjs'
import githubDarkDimmed from 'shiki/themes/github-dark-dimmed.mjs'

const highlighter = createHighlighterCoreSync({
  themes: [githubDarkDimmed],
  langs: [tsx, bash, ts],
  engine: createJavaScriptRegexEngine(),
})

const langMap: Record<string, string> = {
  tsx: 'tsx',
  ts: 'typescript',
  typescript: 'typescript',
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
}

/**
 * A styled monospace code block with syntax highlighting for displaying terminal commands or source code.
 *
 * @example <CodeBlock code="bun add jc" language="bash" />
 * @example <CodeBlock code="const x: number = 42;" language="ts" />
 * @example <CodeBlock code="npm install" inline />
 */
export interface CodeBlockProps {
  /** The code content to display */
  code: string
  /** Programming language (shown as label) */
  language?: string
  /** Whether to show a compact inline-style block */
  inline?: boolean
}

/** A styled monospace code block with syntax highlighting. */
export function CodeBlock({ code, language, inline = false }: CodeBlockProps) {
  if (inline) {
    return (
      <code className="bg-surface-raised border border-border rounded px-2 py-0.5 text-sm font-mono text-fg-muted">
        {code}
      </code>
    )
  }

  const lang = langMap[language ?? ''] ?? 'tsx'
  const html = highlighter.codeToHtml(code, {
    lang,
    theme: 'github-dark-dimmed',
  })

  // Strip shiki's <pre><code> wrapper — we provide our own
  const innerHtml = html
    .replace(/^<pre[^>]*><code>/, '')
    .replace(/<\/code><\/pre>$/, '')

  return (
    <div className="relative rounded-lg border border-border bg-surface-raised overflow-hidden">
      {language && (
        <div className="px-4 py-2 border-b border-border">
          <span className="text-xs font-mono text-fg-subtle">{language}</span>
        </div>
      )}
      <pre className="p-4 overflow-auto text-[13px] leading-relaxed font-mono m-0">
        <code dangerouslySetInnerHTML={{ __html: innerHtml }} />
      </pre>
    </div>
  )
}
