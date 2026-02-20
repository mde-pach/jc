'use client'

/**
 * Live preview panel for the showcase app.
 *
 * Responsibilities:
 * - Lazy-loads the selected component from the host's registry
 * - Resolves fixture qualified keys in prop values to real ReactNodes
 * - Resolves children (text string or fixture) based on the current mode
 * - Generates a code preview string showing the equivalent JSX
 * - Wraps the rendered component in an ErrorBoundary for resilience
 */

import { Component, type ComponentType, type ReactNode, useEffect, useMemo, useState } from 'react'
import { resolveControlType } from '../lib/faker-map.js'
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
}: ShowcasePreviewProps) {
  const [LoadedComponent, setLoadedComponent] = useState<ComponentType<any> | null>(null)
  const [error, setError] = useState<string | null>(null)

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

      // Resolve fixture qualified keys to actual React elements
      if (controlType === 'component' && typeof value === 'string') {
        const resolved = resolveFixtureValue(value, fixtures)
        if (resolved !== undefined) {
          result[key] = resolved
        }
        continue
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
          }}
        >
          {error ? (
            <p style={{ fontSize: '11px', color: '#ef4444' }}>{error}</p>
          ) : !LoadedComponent ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', opacity: 0.4 }}>
              Loading...
            </div>
          ) : (
            <ErrorBoundary componentName={component.displayName}>
              {Wrapper ? (
                <Wrapper>
                  <LoadedComponent {...cleanProps}>
                    {resolvedChildren}
                  </LoadedComponent>
                </Wrapper>
              ) : (
                <LoadedComponent {...cleanProps}>
                  {resolvedChildren}
                </LoadedComponent>
              )}
            </ErrorBoundary>
          )}
        </div>
      </div>

      {/* Code preview */}
      <div
        style={{
          borderTop: '1px solid var(--jc-border)',
          padding: '12px 16px',
          backgroundColor: 'var(--jc-muted)',
        }}
      >
        <pre
          style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            opacity: 0.6,
            overflowX: 'auto',
            margin: 0,
          }}
        >
          <code>
            {generateCodePreview(
              component,
              propValues,
              childrenText,
              childrenMode,
              childrenFixtureKey,
              fixtures,
            )}
          </code>
        </pre>
      </div>
    </div>
  )
}

/** Build a readable JSX code string for the code preview footer */
function generateCodePreview(
  component: JcComponentMeta,
  props: Record<string, unknown>,
  children: string,
  childrenMode: 'text' | 'fixture',
  childrenFixtureKey: string | null,
  fixtures: JcResolvedFixture[],
): string {
  const name = component.displayName
  const propStrings: string[] = []

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === '') continue

    const propMeta = component.props[key]
    const controlType = propMeta ? resolveControlType(propMeta) : null

    // Component props: show a readable representation
    if (controlType === 'component' && typeof value === 'string') {
      if (!value) continue
      const codeStr = fixtureToCodeString(value, fixtures)
      propStrings.push(`${key}={${codeStr}}`)
      continue
    }

    if (typeof value === 'boolean') {
      if (value) propStrings.push(key)
    } else if (typeof value === 'string') {
      propStrings.push(`${key}="${value}"`)
    } else if (typeof value === 'number') {
      propStrings.push(`${key}={${value}}`)
    } else {
      propStrings.push(`${key}={${JSON.stringify(value)}}`)
    }
  }

  const propsStr = propStrings.length > 0 ? ` ${propStrings.join(' ')}` : ''

  // Children
  let childrenStr = ''
  if (component.acceptsChildren) {
    if (childrenMode === 'fixture' && childrenFixtureKey) {
      childrenStr = fixtureToCodeString(childrenFixtureKey, fixtures)
    } else if (children) {
      childrenStr = children
    }
  }

  if (childrenStr) {
    return `<${name}${propsStr}>${childrenStr}</${name}>`
  }
  return `<${name}${propsStr} />`
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
        <div style={{ fontSize: '11px', color: '#ef4444', padding: '8px', textAlign: 'center' }}>
          <p style={{ fontWeight: 500, margin: 0 }}>Render error</p>
          <p style={{ opacity: 0.5, marginTop: '4px' }}>{this.state.error}</p>
        </div>
      )
    }
    return this.props.children
  }
}
