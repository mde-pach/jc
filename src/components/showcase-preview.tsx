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

import { type ComponentType, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { C_DARK, C_LIGHT, generateCodeTokens, generateImportTokens } from '../lib/code-tokens.js'
import { generateVariedInstances, resolveControlType } from '../lib/faker-map.js'
import { getPref, setPref } from '../lib/preferences.js'
import { useOptionalShowcaseContext } from '../lib/showcase-context.js'
import { useResolvedComponent } from '../lib/use-resolved-component.jsx'
import type { FixtureOverride } from '../lib/use-showcase-state.js'
import type { JcTheme } from '../lib/use-theme.js'
import type { ChildItem, JcComponentMeta, JcMeta, JcPlugin, JcResolvedPluginItem } from '../types.js'
import { ErrorBoundary } from './error-boundary.js'

/** Module-level sentinels — stable references, no useMemo needed */
const EMPTY_META: JcMeta = { generatedAt: '', componentDir: '', components: [] }
const EMPTY_COMPONENT: JcComponentMeta = {
  displayName: '',
  filePath: '',
  description: '',
  props: {},
  acceptsChildren: false,
}

interface ShowcasePreviewProps {
  component?: JcComponentMeta
  propValues?: Record<string, unknown>
  childrenItems?: ChildItem[]
  resolvedItems?: JcResolvedPluginItem[]
  plugins?: JcPlugin[]
  meta?: JcMeta
  fixtureOverrides?: Record<string, FixtureOverride>
  wrapperPropsMap?: Record<string, Record<string, unknown>>
  // biome-ignore lint/suspicious/noExplicitAny: registry values are dynamically imported components with unknown prop shapes
  registry?: Record<string, () => Promise<ComponentType<any>>>
  wrapper?: ComponentType<{ children: ReactNode }>
  viewportWidth?: number
  theme?: JcTheme
  instanceCount?: 1 | 3 | 5
  onInstanceCountChange?: (count: 1 | 3 | 5) => void
  presetMode?: 'generated' | number
}

export function ShowcasePreview(props: ShowcasePreviewProps) {
  const ctx = useOptionalShowcaseContext()

  // Resolve each prop: explicit prop wins, then context fallback
  const component = props.component ?? ctx?.state.selectedComponent
  const propValues = props.propValues ?? ctx?.state.propValues ?? {}
  const childrenItems = props.childrenItems ?? ctx?.state.childrenItems ?? []
  const resolvedItems = props.resolvedItems ?? ctx?.resolvedItems ?? []
  const plugins = props.plugins ?? ctx?.plugins ?? []
  const meta = props.meta ?? ctx?.meta
  const fixtureOverrides = props.fixtureOverrides ?? ctx?.state.fixtureOverrides ?? {}
  const wrapperPropsMap = props.wrapperPropsMap ?? ctx?.state.wrapperPropsMap ?? {}
  const registry = props.registry ?? ctx?.registry ?? {}
  const wrapper = props.wrapper ?? ctx?.wrapper
  const viewportWidth = props.viewportWidth
  const theme = props.theme ?? 'dark'
  const instanceCount = props.instanceCount ?? ctx?.state.instanceCount ?? 1
  const onInstanceCountChange = props.onInstanceCountChange ?? ctx?.state.setInstanceCount
  const presetMode = props.presetMode ?? ctx?.state.presetMode ?? 'generated'

  // Use module-level sentinels when component/meta not available
  const safeComponent = component ?? EMPTY_COMPONENT
  const safeMeta = meta ?? EMPTY_META

  const [copied, setCopied] = useState(false)
  const [codeMode, _setCodeMode] = useState<'jsx' | 'full'>(() => getPref('codeMode') ?? 'jsx')
  const setCodeMode = useCallback((mode: 'jsx' | 'full') => {
    _setCodeMode(mode)
    setPref('codeMode', mode)
  }, [])

  const {
    LoadedComponent,
    wrappersReady,
    error,
    cleanProps,
    resolvedChildren,
    resolveProps,
    wrapElement,
  } = useResolvedComponent({
    component: safeComponent,
    propValues,
    childrenItems,
    resolvedItems,
    plugins,
    meta: safeMeta,
    fixtureOverrides,
    wrapperPropsMap,
    registry,
    wrapper,
  })

  // ── Event logging for callback props ──────────────────────────
  interface EventLogEntry {
    id: number
    propName: string
    args: unknown[]
    timestamp: number
  }
  const eventLogRef = useRef<EventLogEntry[]>([])
  const eventIdRef = useRef(0)
  const [eventLogVersion, setEventLogVersion] = useState(0)
  const [showEvents, setShowEvents] = useState(false)
  const eventLog = eventLogRef.current

  // Clear events when component changes
  useEffect(() => {
    eventLogRef.current = []
    setEventLogVersion(0)
  }, [component?.displayName])

  // Wrap cleanProps: inject logging wrappers for function-type (readonly) props
  const propsWithEvents = useMemo(() => {
    if (!component) return cleanProps
    const result = { ...cleanProps }
    for (const [key, propMeta] of Object.entries(component.props)) {
      const ct = resolveControlType(propMeta)
      if (ct === 'readonly') {
        result[key] = (...args: unknown[]) => {
          const entry: EventLogEntry = {
            id: ++eventIdRef.current,
            propName: key,
            args,
            timestamp: Date.now(),
          }
          eventLogRef.current = [...eventLogRef.current.slice(-49), entry]
          setEventLogVersion((v) => v + 1)
        }
      }
    }
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanProps, component, eventLogVersion])

  // Generate varied instances for multi-render (generated mode only)
  const firstChildText =
    childrenItems.length > 0 && childrenItems[0].type === 'text' ? childrenItems[0].value : ''
  const variedInstances = useMemo(() => {
    if (!component || presetMode !== 'generated' || instanceCount <= 1) return null
    return generateVariedInstances(safeComponent, plugins, resolvedItems, propValues, firstChildText, instanceCount)
  }, [component, presetMode, instanceCount, safeComponent, plugins, resolvedItems, propValues, firstChildText])

  // Generate highlighted JSX tokens
  const colors = theme === 'light' ? C_LIGHT : C_DARK
  const jsxTokens = useMemo(
    () =>
      generateCodeTokens(
        safeComponent,
        propValues,
        childrenItems,
        resolvedItems,
        colors,
        fixtureOverrides,
        safeMeta,
        wrapperPropsMap,
      ),
    [
      safeComponent,
      propValues,
      childrenItems,
      resolvedItems,
      colors,
      fixtureOverrides,
      safeMeta,
      wrapperPropsMap,
    ],
  )

  const importTokens = useMemo(
    () =>
      generateImportTokens(
        safeComponent,
        propValues,
        childrenItems,
        resolvedItems,
        fixtureOverrides,
        safeMeta,
        colors,
      ),
    [safeComponent, propValues, childrenItems, resolvedItems, fixtureOverrides, safeMeta, colors],
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

  // Cannot render without a component
  if (!component) return null

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
                x{n}
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
                    {wrapElement(<LoadedComponent {...instProps}>{instChildren}</LoadedComponent>)}
                  </ErrorBoundary>
                )
              })}
            </div>
          ) : (
            <ErrorBoundary componentName={component.displayName}>
              {wrapElement(<LoadedComponent {...propsWithEvents}>{resolvedChildren}</LoadedComponent>)}
            </ErrorBoundary>
          )}
        </div>
      </div>

      {/* Events panel — shows logged callback invocations */}
      {eventLog.length > 0 && (
        <div
          style={{
            borderTop: '1px solid var(--jc-border)',
            flexShrink: 0,
            maxHeight: showEvents ? '150px' : '28px',
            transition: 'max-height 0.15s ease',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() => setShowEvents((s) => !s)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              height: '28px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: 'var(--jc-muted)',
              color: 'inherit',
              fontSize: '9px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Events
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '16px',
                  height: '14px',
                  padding: '0 4px',
                  borderRadius: '7px',
                  backgroundColor: 'var(--jc-accent)',
                  color: 'var(--jc-accent-fg)',
                  fontSize: '9px',
                  fontWeight: 700,
                }}
              >
                {eventLog.length}
              </span>
            </span>
            <span style={{ opacity: 0.4, fontSize: '8px' }}>{showEvents ? '\u25B2' : '\u25BC'}</span>
          </button>
          {showEvents && (
            <div style={{ overflowY: 'auto', maxHeight: '122px', padding: '4px 0' }}>
              {[...eventLog].reverse().map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '8px',
                    padding: '2px 16px',
                    fontSize: '10px',
                    fontFamily: '"SF Mono", "Fira Code", Menlo, Consolas, monospace',
                  }}
                >
                  <span style={{ opacity: 0.3, fontSize: '8px', flexShrink: 0 }}>
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span style={{ color: 'var(--jc-accent)', fontWeight: 600 }}>
                    {entry.propName}
                  </span>
                  <span style={{ opacity: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.args.length > 0
                      ? entry.args.map((a) => {
                          try { return JSON.stringify(a) }
                          catch { return String(a) }
                        }).join(', ')
                      : '(no args)'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
