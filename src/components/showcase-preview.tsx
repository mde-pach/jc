'use client'

/**
 * Live preview panel for the showcase app.
 *
 * Responsibilities:
 * - Lazy-loads the selected component from the host's registry
 * - Resolves fixture qualified keys in prop values to real ReactNodes
 * - Resolves children (text string or fixture) based on the current mode
 * - Generates a syntax-highlighted, multiline JSX code preview
 * - Wraps the rendered component in an ErrorBoundary for resilience
 */

import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { C_DARK, C_LIGHT, generateCodeTokens, generateImportTokens } from '../lib/code-tokens.js'
import { generateVariedInstances } from '../lib/faker-map.js'
import type { FixtureOverride } from '../lib/use-showcase-state.js'
import { useResolvedComponent } from '../lib/use-resolved-component.jsx'
import type { JcTheme } from '../lib/use-theme.js'
import type { JcComponentMeta, JcMeta, JcResolvedFixture } from '../types.js'
import { ErrorBoundary } from './error-boundary.js'

interface ShowcasePreviewProps {
  component: JcComponentMeta
  propValues: Record<string, unknown>
  childrenText: string
  childrenMode: 'text' | 'fixture'
  childrenFixtureKey: string | null
  fixtures: JcResolvedFixture[]
  meta: JcMeta
  fixtureOverrides: Record<string, FixtureOverride>
  wrapperPropsMap: Record<string, Record<string, unknown>>
  // biome-ignore lint/suspicious/noExplicitAny: registry values are dynamically imported components with unknown prop shapes
  registry: Record<string, () => Promise<ComponentType<any>>>
  wrapper?: ComponentType<{ children: ReactNode }>
  viewportWidth?: number
  theme?: JcTheme
  instanceCount?: 1 | 3 | 5
  onInstanceCountChange?: (count: 1 | 3 | 5) => void
  presetMode?: 'generated' | number
}

export function ShowcasePreview({
  component,
  propValues,
  childrenText,
  childrenMode,
  childrenFixtureKey,
  fixtures,
  meta,
  fixtureOverrides,
  wrapperPropsMap,
  registry,
  wrapper,
  viewportWidth,
  theme = 'dark',
  instanceCount = 1,
  onInstanceCountChange,
  presetMode = 'generated',
}: ShowcasePreviewProps) {
  const [copied, setCopied] = useState(false)
  const [codeMode, setCodeMode] = useState<'jsx' | 'full'>('jsx')

  const {
    LoadedComponent,
    wrappersReady,
    error,
    cleanProps,
    resolvedChildren,
    resolveProps,
    wrapElement,
  } = useResolvedComponent({
    component,
    propValues,
    childrenText,
    childrenMode,
    childrenFixtureKey,
    fixtures,
    meta,
    fixtureOverrides,
    wrapperPropsMap,
    registry,
    wrapper,
  })

  // Generate varied instances for multi-render (generated mode only)
  const variedInstances = useMemo(() => {
    if (presetMode !== 'generated' || instanceCount <= 1) return null
    return generateVariedInstances(component, fixtures, propValues, childrenText, instanceCount)
  }, [presetMode, instanceCount, component, fixtures, propValues, childrenText])

  // Generate highlighted JSX tokens
  const colors = theme === 'light' ? C_LIGHT : C_DARK
  const jsxTokens = useMemo(
    () =>
      generateCodeTokens(
        component,
        propValues,
        childrenText,
        childrenMode,
        childrenFixtureKey,
        fixtures,
        colors,
        fixtureOverrides,
        meta,
        wrapperPropsMap,
      ),
    [
      component,
      propValues,
      childrenText,
      childrenMode,
      childrenFixtureKey,
      fixtures,
      colors,
      fixtureOverrides,
      meta,
      wrapperPropsMap,
    ],
  )

  const importTokens = useMemo(
    () =>
      generateImportTokens(
        component,
        propValues,
        childrenMode,
        childrenFixtureKey,
        fixtures,
        fixtureOverrides,
        meta,
        colors,
      ),
    [
      component,
      propValues,
      childrenMode,
      childrenFixtureKey,
      fixtures,
      fixtureOverrides,
      meta,
      colors,
    ],
  )

  const codeTokens = useMemo(() => {
    if (codeMode === 'full' && importTokens.length > 0) {
      return [...importTokens, { text: '\n', color: '' }, ...jsxTokens]
    }
    return jsxTokens
  }, [codeMode, importTokens, jsxTokens])

  const copyCode = useCallback(() => {
    const text = codeTokens.map((t) => t.text).join('')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [codeTokens])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          height: '42px',
          flexShrink: 0,
          borderBottom: '1px solid var(--jc-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>{component.displayName}</h2>
          <span style={{ fontSize: '10px', opacity: 0.4, fontFamily: 'monospace' }}>
            {component.filePath}
          </span>
        </div>
        {/* Instance count picker — only in generated mode */}
        {presetMode === 'generated' && onInstanceCountChange && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              borderRadius: '6px',
              border: '1px solid var(--jc-border)',
              padding: '2px',
            }}
          >
            {([1, 3, 5] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onInstanceCountChange(n)}
                style={{
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  fontWeight: 500,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: instanceCount === n ? 'var(--jc-accent)' : 'transparent',
                  color: instanceCount === n ? 'var(--jc-accent-fg)' : 'inherit',
                  opacity: instanceCount === n ? 1 : 0.4,
                  transition: 'all 0.1s',
                }}
              >
                ×{n}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preview area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          backgroundImage: 'repeating-conic-gradient(var(--jc-checker) 0% 25%, transparent 0% 50%)',
          backgroundSize: '16px 16px',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--jc-bg)',
            borderRadius: '8px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid var(--jc-border)',
            minWidth: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...(viewportWidth
              ? {
                  width: `${viewportWidth}px`,
                  maxWidth: '100%',
                  transition: 'width 0.2s ease',
                }
              : {}),
          }}
        >
          {error ? (
            <p style={{ fontSize: '11px', color: '#ef4444' }}>{error}</p>
          ) : !LoadedComponent || !wrappersReady ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                opacity: 0.4,
              }}
            >
              Loading...
            </div>
          ) : variedInstances && variedInstances.length > 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              {variedInstances.map((inst, idx) => {
                const instProps = resolveProps(inst.propValues)
                const instChildren = component.acceptsChildren
                  ? inst.childrenText || undefined
                  : undefined
                return (
                  <ErrorBoundary key={idx} componentName={component.displayName}>
                    {wrapElement(
                      <LoadedComponent {...instProps}>{instChildren}</LoadedComponent>,
                    )}
                  </ErrorBoundary>
                )
              })}
            </div>
          ) : (
            <ErrorBoundary componentName={component.displayName}>
              {wrapElement(
                <LoadedComponent {...cleanProps}>{resolvedChildren}</LoadedComponent>,
              )}
            </ErrorBoundary>
          )}
        </div>
      </div>

      {/* Code preview — syntax highlighted, fits content up to 1/3 of panel */}
      <div
        style={{
          borderTop: '1px solid var(--jc-code-border)',
          backgroundColor: 'var(--jc-code-bg)',
          flexShrink: 0,
          maxHeight: '33%',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 16px',
            borderBottom: '1px solid var(--jc-code-border)',
            color: 'var(--jc-code-header)',
            fontSize: '9px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            position: 'sticky',
            top: 0,
            backgroundColor: 'var(--jc-code-bg)',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              borderRadius: '4px',
              border: '1px solid var(--jc-code-border)',
              padding: '1px',
            }}
          >
            <button
              type="button"
              onClick={() => setCodeMode('jsx')}
              style={{
                fontSize: '9px',
                fontWeight: 600,
                padding: '1px 5px',
                borderRadius: '3px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: codeMode === 'jsx' ? 'var(--jc-code-header)' : 'transparent',
                color: codeMode === 'jsx' ? 'var(--jc-code-bg)' : 'var(--jc-code-header)',
                opacity: codeMode === 'jsx' ? 1 : 0.5,
                transition: 'all 0.1s',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              JSX
            </button>
            <button
              type="button"
              onClick={() => setCodeMode('full')}
              style={{
                fontSize: '9px',
                fontWeight: 600,
                padding: '1px 5px',
                borderRadius: '3px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: codeMode === 'full' ? 'var(--jc-code-header)' : 'transparent',
                color: codeMode === 'full' ? 'var(--jc-code-bg)' : 'var(--jc-code-header)',
                opacity: codeMode === 'full' ? 1 : 0.5,
                transition: 'all 0.1s',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Full
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            {copied && (
              <span
                style={{
                  position: 'absolute',
                  right: '100%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  marginRight: '6px',
                  fontSize: '9px',
                  fontWeight: 600,
                  color: '#34d399',
                  whiteSpace: 'nowrap',
                  animation: 'jc-fade-out 1.5s ease forwards',
                }}
              >
                Copied!
              </span>
            )}
            <button
              type="button"
              onClick={copyCode}
              title="Copy code"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: copied ? '#34d399' : 'var(--jc-code-header)',
                padding: '2px',
                borderRadius: '3px',
                transition: 'color 0.15s',
              }}
            >
              {copied ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <CodeBlock tokens={codeTokens} />
        </div>
      </div>
    </div>
  )
}

// ── Code block with line numbers ────────────────────────────────

interface CodeLine {
  tokens: { text: string; color: string }[]
}

/** Split flat token array into lines for line-numbered rendering */
function tokensToLines(tokens: { text: string; color: string }[]): CodeLine[] {
  const lines: CodeLine[] = [{ tokens: [] }]
  for (const token of tokens) {
    const parts = token.text.split('\n')
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) lines.push({ tokens: [] })
      if (parts[i]) {
        lines[lines.length - 1].tokens.push({ text: parts[i], color: token.color })
      }
    }
  }
  return lines
}

function CodeBlock({ tokens }: { tokens: { text: string; color: string }[] }) {
  const lines = tokensToLines(tokens)
  const gutterWidth = String(lines.length).length * 8 + 16

  return (
    <pre
      style={{
        fontSize: '12px',
        fontFamily: '"SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace',
        lineHeight: 1.7,
        margin: 0,
        whiteSpace: 'pre',
        tabSize: 2,
      }}
    >
      <code style={{ display: 'block' }}>
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              paddingRight: '16px',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: `${gutterWidth}px`,
                minWidth: `${gutterWidth}px`,
                textAlign: 'right',
                paddingRight: '12px',
                color: 'var(--jc-code-header)',
                opacity: 0.35,
                userSelect: 'none',
                borderRight: '1px solid var(--jc-code-border)',
                marginRight: '12px',
              }}
            >
              {i + 1}
            </span>
            <span>
              {line.tokens.map((token, j) => (
                <span key={j} style={{ color: token.color }}>
                  {token.text}
                </span>
              ))}
            </span>
          </div>
        ))}
      </code>
    </pre>
  )
}
