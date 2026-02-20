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
  Component,
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getArrayItemType, resolveControlType } from '../lib/faker-map.js'
import { fixtureToCodeString, resolveFixtureValue } from '../lib/fixtures.js'
import type { JcComponentMeta, JcResolvedFixture } from '../types.js'

interface ShowcasePreviewProps {
  component: JcComponentMeta
  propValues: Record<string, unknown>
  childrenText: string
  childrenMode: 'text' | 'fixture'
  childrenFixtureKey: string | null
  fixtures: JcResolvedFixture[]
  registry: Record<string, () => Promise<ComponentType<any>>>
  wrapper?: ComponentType<{ children: ReactNode }>
  viewportWidth?: number
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
}: ShowcasePreviewProps) {
  const [LoadedComponent, setLoadedComponent] = useState<ComponentType<any> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [codeExpanded, setCodeExpanded] = useState(false)

  useEffect(() => {
    setLoadedComponent(null)
    setError(null)

    const loader = registry[component.displayName]
    if (!loader) {
      setError(`No registry entry for "${component.displayName}"`)
      return
    }

    loader()
      .then((Comp) => setLoadedComponent(() => Comp))
      .catch((err) => setError(String(err)))
  }, [component.displayName, registry])

  const cleanProps = useMemo(() => {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(propValues)) {
      if (value === undefined || value === '' || value === null) continue

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
  const codeTokens = useMemo(
    () =>
      generateCodeTokens(
        component,
        propValues,
        childrenText,
        childrenMode,
        childrenFixtureKey,
        fixtures,
      ),
    [component, propValues, childrenText, childrenMode, childrenFixtureKey, fixtures],
  )

  const toggleCode = useCallback(() => setCodeExpanded((prev) => !prev), [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--jc-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>
            {component.displayName}
          </h2>
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
          backgroundImage:
            'repeating-conic-gradient(var(--jc-checker) 0% 25%, transparent 0% 50%)',
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

      {/* Code preview — syntax highlighted, collapsible */}
      <div
        style={{
          borderTop: '1px solid var(--jc-border)',
          backgroundColor: '#0f172a',
          position: 'relative',
        }}
      >
        {/* Toggle bar */}
        <button
          type="button"
          onClick={toggleCode}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '6px 16px',
            background: 'none',
            border: 'none',
            borderBottom: codeExpanded ? '1px solid #1e293b' : 'none',
            cursor: 'pointer',
            color: '#94a3b8',
            fontSize: '9px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          <span>JSX</span>
          <span style={{ fontSize: '12px', lineHeight: 1, transition: 'transform 0.15s', transform: codeExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▾
          </span>
        </button>

        {/* Code content */}
        <div
          style={{
            maxHeight: codeExpanded ? '300px' : '72px',
            overflow: codeExpanded ? 'auto' : 'hidden',
            transition: 'max-height 0.2s ease',
            padding: '0 16px 10px',
          }}
        >
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

        {/* Fade overlay when collapsed */}
        {!codeExpanded && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '28px',
              background: 'linear-gradient(transparent, #0f172a)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  )
}

// ── Syntax highlighting ──────────────────────────────────────
//
// Generates an array of colored text tokens for JSX syntax highlighting.
// Colors follow a dark theme palette:
//   - Tag names:   cyan (#7dd3fc)
//   - Prop names:  purple (#c4b5fd)
//   - Strings:     amber (#fde68a)
//   - Numbers:     green (#86efac)
//   - Booleans:    orange (#fdba74)
//   - Brackets:    slate (#94a3b8)
//   - Children:    white (#e2e8f0)
//   - Components:  green (#34d399)

interface CodeToken {
  text: string
  color: string
}

const C = {
  tag: '#7dd3fc',
  prop: '#c4b5fd',
  string: '#fde68a',
  number: '#86efac',
  boolean: '#fdba74',
  bracket: '#94a3b8',
  text: '#e2e8f0',
  component: '#34d399',
  punctuation: '#64748b',
} as const

function generateCodeTokens(
  component: JcComponentMeta,
  props: Record<string, unknown>,
  children: string,
  childrenMode: 'text' | 'fixture',
  childrenFixtureKey: string | null,
  fixtures: JcResolvedFixture[],
): CodeToken[] {
  const name = component.displayName
  const tokens: CodeToken[] = []

  // Collect prop tokens
  const propTokenGroups: CodeToken[][] = []

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === '') continue
    // Skip empty arrays
    if (Array.isArray(value) && value.length === 0) continue

    const propMeta = component.props[key]
    const controlType = propMeta ? resolveControlType(propMeta) : null

    const group: CodeToken[] = []

    // Component props: show fixture as JSX
    if (controlType === 'component' && typeof value === 'string') {
      if (!value) continue
      const codeStr = fixtureToCodeString(value, fixtures)
      group.push(
        { text: key, color: C.prop },
        { text: '={', color: C.punctuation },
        { text: codeStr, color: C.component },
        { text: '}', color: C.punctuation },
      )
      propTokenGroups.push(group)
      continue
    }

    if (typeof value === 'boolean') {
      if (!value) continue // skip false booleans
      group.push({ text: key, color: C.prop })
    } else if (typeof value === 'string') {
      group.push(
        { text: key, color: C.prop },
        { text: '=', color: C.punctuation },
        { text: `"${value}"`, color: C.string },
      )
    } else if (typeof value === 'number') {
      group.push(
        { text: key, color: C.prop },
        { text: '={', color: C.punctuation },
        { text: String(value), color: C.number },
        { text: '}', color: C.punctuation },
      )
    } else if (Array.isArray(value)) {
      // Arrays: format as {["a", "b"]} or {[1, 2]}
      group.push(
        { text: key, color: C.prop },
        { text: '={', color: C.punctuation },
      )
      group.push(...formatArrayTokens(value, fixtures))
      group.push({ text: '}', color: C.punctuation })
    } else {
      group.push(
        { text: key, color: C.prop },
        { text: '={', color: C.punctuation },
        { text: JSON.stringify(value), color: C.text },
        { text: '}', color: C.punctuation },
      )
    }

    propTokenGroups.push(group)
  }

  // Children
  let childrenStr = ''
  if (component.acceptsChildren) {
    if (childrenMode === 'fixture' && childrenFixtureKey) {
      childrenStr = fixtureToCodeString(childrenFixtureKey, fixtures)
    } else if (children) {
      childrenStr = children
    }
  }

  // Decide layout: multiline if >1 prop or has children
  const multiline = propTokenGroups.length > 1 || (propTokenGroups.length > 0 && childrenStr)

  // Opening tag
  tokens.push(
    { text: '<', color: C.bracket },
    { text: name, color: C.tag },
  )

  if (multiline) {
    for (const group of propTokenGroups) {
      tokens.push({ text: '\n  ', color: '' })
      tokens.push(...group)
    }
    if (childrenStr) {
      tokens.push(
        { text: '\n', color: '' },
        { text: '>', color: C.bracket },
        { text: '\n  ', color: '' },
      )
      // Children content — fixture references are component-colored
      if (childrenMode === 'fixture' && childrenFixtureKey) {
        tokens.push({ text: childrenStr, color: C.component })
      } else {
        tokens.push({ text: childrenStr, color: C.text })
      }
      tokens.push(
        { text: '\n', color: '' },
        { text: '</', color: C.bracket },
        { text: name, color: C.tag },
        { text: '>', color: C.bracket },
      )
    } else {
      tokens.push(
        { text: '\n', color: '' },
        { text: '/>', color: C.bracket },
      )
    }
  } else {
    // Single line
    for (const group of propTokenGroups) {
      tokens.push({ text: ' ', color: '' })
      tokens.push(...group)
    }
    if (childrenStr) {
      tokens.push({ text: '>', color: C.bracket })
      if (childrenMode === 'fixture' && childrenFixtureKey) {
        tokens.push({ text: childrenStr, color: C.component })
      } else {
        tokens.push({ text: childrenStr, color: C.text })
      }
      tokens.push(
        { text: '</', color: C.bracket },
        { text: name, color: C.tag },
        { text: '>', color: C.bracket },
      )
    } else {
      tokens.push(
        { text: ' ', color: '' },
        { text: '/>', color: C.bracket },
      )
    }
  }

  return tokens
}

/** Format array values as highlighted tokens */
function formatArrayTokens(
  arr: unknown[],
  fixtures: JcResolvedFixture[],
): CodeToken[] {
  const tokens: CodeToken[] = []
  tokens.push({ text: '[', color: C.punctuation })

  for (let i = 0; i < arr.length; i++) {
    if (i > 0) tokens.push({ text: ', ', color: C.punctuation })

    const item = arr[i]
    if (typeof item === 'string') {
      // Check if it's a fixture qualified key
      const fixture = fixtures.find((f) => f.qualifiedKey === item)
      if (fixture) {
        const pascal = fixture.label
          .split(/[\s-]+/)
          .map((w) => w[0].toUpperCase() + w.slice(1))
          .join('')
        tokens.push({ text: pascal, color: C.component })
      } else {
        tokens.push({ text: `"${item}"`, color: C.string })
      }
    } else if (typeof item === 'number') {
      tokens.push({ text: String(item), color: C.number })
    } else if (typeof item === 'boolean') {
      tokens.push({ text: String(item), color: C.boolean })
    } else {
      tokens.push({ text: JSON.stringify(item), color: C.text })
    }
  }

  tokens.push({ text: ']', color: C.punctuation })
  return tokens
}

// ── Error boundary ──────────────────────────────────────────

interface ErrorBoundaryProps {
  componentName: string
  children: ReactNode
}
interface ErrorBoundaryState {
  error: string | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(err: Error) {
    return { error: err.message }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.componentName !== this.props.componentName) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            fontSize: '11px',
            color: '#ef4444',
            padding: '8px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontWeight: 500, margin: 0 }}>Render error</p>
          <p style={{ opacity: 0.5, marginTop: '4px' }}>{this.state.error}</p>
        </div>
      )
    }
    return this.props.children
  }
}
