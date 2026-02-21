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
  useEffect,
  useMemo,
  useState,
} from 'react'
import { C_DARK, C_LIGHT, generateCodeTokens } from '../lib/code-tokens.js'
import { getArrayItemType, resolveControlType } from '../lib/faker-map.js'
import { resolveFixtureValue } from '../lib/fixtures.js'
import type { JcTheme } from '../lib/use-theme.js'
import type { JcComponentMeta, JcResolvedFixture } from '../types.js'
import { ErrorBoundary } from './error-boundary.js'

interface ShowcasePreviewProps {
  component: JcComponentMeta
  propValues: Record<string, unknown>
  childrenText: string
  childrenMode: 'text' | 'fixture'
  childrenFixtureKey: string | null
  fixtures: JcResolvedFixture[]
  // biome-ignore lint/suspicious/noExplicitAny: registry values are dynamically imported components with unknown prop shapes
  registry: Record<string, () => Promise<ComponentType<any>>>
  wrapper?: ComponentType<{ children: ReactNode }>
  viewportWidth?: number
  theme?: JcTheme
}

export function ShowcasePreview({
  component,
  propValues,
  childrenText,
  childrenMode,
  childrenFixtureKey,
  fixtures,
  registry,
  wrapper: Wrapper,
  viewportWidth,
  theme = 'dark',
}: ShowcasePreviewProps) {
  // biome-ignore lint/suspicious/noExplicitAny: loaded component has dynamic props determined at runtime
  const [loaded, setLoaded] = useState<{
    name: string
    Component: ComponentType<any>
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setError(null)

    const name = component.displayName
    const loader = registry[name]
    if (!loader) {
      setLoaded(null)
      setError(`No registry entry for "${name}"`)
      return
    }

    let cancelled = false
    loader()
      .then((Comp) => {
        if (!cancelled) setLoaded({ name, Component: Comp })
      })
      .catch((err) => {
        if (!cancelled) setError(String(err))
      })
    return () => {
      cancelled = true
    }
  }, [component.displayName, registry])

  // Only use the loaded component if it matches the current selection
  const LoadedComponent = loaded && loaded.name === component.displayName ? loaded.Component : null

  const cleanProps = useMemo(() => {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(propValues)) {
      if (value === undefined || value === null) continue

      const propMeta = component.props[key]
      const controlType = propMeta ? resolveControlType(propMeta) : null

      // Resolve fixture qualified keys to actual React elements (or constructors for icons)
      if (controlType === 'component' && typeof value === 'string') {
        const isIcon = propMeta?.componentKind === 'icon'
        const resolved = resolveFixtureValue(value, fixtures, isIcon)
        if (resolved !== undefined) {
          result[key] = resolved
        }
        continue
      }

      // Resolve array props containing fixture qualified keys
      if (controlType === 'array' && Array.isArray(value) && propMeta) {
        const itemInfo = getArrayItemType(propMeta)
        if (itemInfo?.isComponent) {
          result[key] = value
            .map((item) => {
              if (typeof item !== 'string') return item
              return resolveFixtureValue(item, fixtures, true) ?? item
            })
            .filter(Boolean)
          continue
        }
      }

      result[key] = value
    }
    return result
  }, [propValues, component.props, fixtures])

  // Resolve children
  const resolvedChildren = useMemo(() => {
    if (!component.acceptsChildren) return undefined
    if (childrenMode === 'fixture' && childrenFixtureKey) {
      return resolveFixtureValue(childrenFixtureKey, fixtures) as ReactNode
    }
    return childrenText || undefined
  }, [component.acceptsChildren, childrenMode, childrenFixtureKey, childrenText, fixtures])

  // Generate highlighted JSX tokens
  const colors = theme === 'light' ? C_LIGHT : C_DARK
  const codeTokens = useMemo(
    () =>
      generateCodeTokens(
        component,
        propValues,
        childrenText,
        childrenMode,
        childrenFixtureKey,
        fixtures,
        colors,
      ),
    [component, propValues, childrenText, childrenMode, childrenFixtureKey, fixtures, colors],
  )

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
          ) : !LoadedComponent ? (
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
          ) : (
            <ErrorBoundary componentName={component.displayName}>
              {Wrapper ? (
                <Wrapper>
                  <LoadedComponent {...cleanProps}>{resolvedChildren}</LoadedComponent>
                </Wrapper>
              ) : (
                <LoadedComponent {...cleanProps}>{resolvedChildren}</LoadedComponent>
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
          <span>JSX</span>
          <button
            type="button"
            onClick={copyCode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: copied ? '#34d399' : 'var(--jc-code-header)',
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '2px 4px',
              borderRadius: '3px',
              transition: 'color 0.15s',
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div style={{ padding: '8px 16px', overflowX: 'auto' }}>
          <pre
            style={{
              fontSize: '12px',
              fontFamily: '"SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace',
              lineHeight: 1.6,
              margin: 0,
              whiteSpace: 'pre',
              tabSize: 2,
            }}
          >
            <code>
              {codeTokens.map((token, i) => (
                <span key={i} style={{ color: token.color }}>
                  {token.text}
                </span>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  )
}
