'use client'

/**
 * Individual prop control field for the showcase controls panel.
 * Thin dispatcher: reads controlType and renders the matching sub-component.
 */

import type { FixtureOverride } from '../../lib/use-showcase-state.js'
import type {
  JcComponentPropKind,
  JcControlType,
  JcMeta,
  JcPlugin,
  JcPluginPickerProps,
  JcPropMeta,
  JcResolvedPluginItem,
} from '../../types.js'
import { ArrayEditor, StructuredItemEditor } from './array-editor.js'
import { ComponentFixtureEditor } from './component-fixture-editor.js'
import { ComponentPicker } from './component-picker.js'
import { inputStyle } from './styles.js'

interface ShowcaseFieldProps {
  label: string
  description?: string
  controlType: JcControlType
  value: unknown
  options?: string[]
  componentKind?: JcComponentPropKind
  resolvedItems?: JcResolvedPluginItem[]
  plugins?: JcPlugin[]
  /** Full prop metadata — needed for array controls to infer item type */
  propMeta?: JcPropMeta
  /** Full meta — needed to look up fixture component metadata */
  meta?: JcMeta
  /** Per-slot fixture overrides for component fixture props */
  fixtureOverrides?: Record<string, FixtureOverride>
  /** Custom picker from the matching plugin (replaces default dropdown) */
  Picker?: React.ComponentType<JcPluginPickerProps>
  /** Suggested built-in plugin when no plugin matches */
  pluginSuggestion?: { name: string; importPath: string; importName: string } | null
  onFixturePropChange?: (slotKey: string, propName: string, value: unknown) => void
  onFixtureChildrenChange?: (slotKey: string, text: string) => void
  onChange: (value: unknown) => void
}

export function ShowcaseField({
  label,
  description,
  controlType,
  value,
  options,
  componentKind,
  resolvedItems,
  plugins,
  propMeta,
  meta,
  fixtureOverrides,
  Picker,
  pluginSuggestion,
  onFixturePropChange,
  onFixtureChildrenChange,
  onChange,
}: ShowcaseFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.7 }}>{label}</span>
          {controlType === 'component' && componentKind && propMeta && (
            <span
              title={
                pluginSuggestion
                  ? `No plugin loaded \u2014 add ${pluginSuggestion.importName} from ${pluginSuggestion.importPath}`
                  : propMeta.type
              }
              style={{
                fontSize: '8px',
                fontWeight: 600,
                letterSpacing: '0.05em',
                padding: '1px 4px',
                borderRadius: '3px',
                backgroundColor: pluginSuggestion
                  ? 'color-mix(in srgb, #f59e0b 15%, transparent)'
                  : 'color-mix(in srgb, var(--jc-accent) 15%, transparent)',
                color: pluginSuggestion ? '#f59e0b' : 'var(--jc-accent)',
                cursor: 'help',
              }}
            >
              {propMeta.type}
            </span>
          )}
          {(controlType === 'array' || controlType === 'object') && propMeta && (
            <span
              title={propMeta.type}
              style={{
                fontSize: '8px',
                fontWeight: 600,
                letterSpacing: '0.05em',
                padding: '1px 4px',
                borderRadius: '3px',
                backgroundColor: 'color-mix(in srgb, var(--jc-accent) 15%, transparent)',
                color: 'var(--jc-accent)',
                cursor: 'help',
              }}
            >
              {propMeta.rawType && propMeta.rawType !== propMeta.type
                ? propMeta.rawType
                : propMeta.type}
            </span>
          )}
        </div>
        {controlType === 'boolean' && (
          <button
            type="button"
            role="switch"
            aria-checked={!!value}
            onClick={() => onChange(!value)}
            style={{
              position: 'relative',
              display: 'inline-flex',
              height: '20px',
              width: '36px',
              flexShrink: 0,
              cursor: 'pointer',
              alignItems: 'center',
              borderRadius: '9999px',
              border: 'none',
              transition: 'background-color 0.15s',
              backgroundColor: value ? '#3b82f6' : '#d1d5db',
            }}
          >
            <span
              style={{
                pointerEvents: 'none',
                display: 'block',
                height: '14px',
                width: '14px',
                borderRadius: '9999px',
                backgroundColor: '#fff',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                transition: 'transform 0.15s',
                transform: value ? 'translateX(16px)' : 'translateX(2px)',
              }}
            />
          </button>
        )}
      </div>

      {description && <p style={{ fontSize: '10px', opacity: 0.4, margin: 0 }}>{description}</p>}

      {controlType === 'text' && (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      )}

      {controlType === 'color' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="color"
            value={String(value ?? '#000000')}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '28px',
              height: '28px',
              padding: '2px',
              border: '1px solid var(--jc-border)',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />
          <input
            type="text"
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>
      )}

      {controlType === 'number' && (
        <input
          type="number"
          value={Number(value ?? 0)}
          onChange={(e) => onChange(Number(e.target.value))}
          style={inputStyle}
        />
      )}

      {controlType === 'select' && options && (
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value || undefined)}
          style={inputStyle}
        >
          {propMeta && !propMeta.required && <option value="">{'\u2014'}</option>}
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {controlType === 'component' && (
        <ComponentPicker
          value={String(value ?? '')}
          resolvedItems={resolvedItems ?? []}
          required={propMeta?.required ?? false}
          onChange={(v) => onChange(v)}
          Picker={Picker}
        />
      )}

      {/* Editable fixture props when a component fixture is selected */}
      {controlType === 'component' &&
        !Picker &&
        meta &&
        fixtureOverrides &&
        onFixturePropChange &&
        onFixtureChildrenChange &&
        typeof value === 'string' &&
        value.startsWith('components/') && (
          <ComponentFixtureEditor
            slotKey={`prop:${label}`}
            qualifiedKey={value}
            meta={meta}
            resolvedItems={resolvedItems ?? []}
            plugins={plugins ?? []}
            fixtureOverrides={fixtureOverrides}
            onFixturePropChange={onFixturePropChange}
            onFixtureChildrenChange={onFixtureChildrenChange}
          />
        )}

      {controlType === 'multiline' && (
        <textarea
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          style={{ ...inputStyle, minHeight: '40px', resize: 'vertical' as const }}
        />
      )}

      {controlType === 'json' && (
        <textarea
          value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value))
            } catch {
              onChange(e.target.value)
            }
          }}
          rows={3}
          style={{
            ...inputStyle,
            minHeight: '60px',
            resize: 'vertical' as const,
            fontFamily: 'monospace',
          }}
        />
      )}

      {controlType === 'object' && propMeta?.structuredFields && (
        <StructuredItemEditor
          item={
            typeof value === 'object' && value !== null && !Array.isArray(value)
              ? (value as Record<string, unknown>)
              : {}
          }
          fields={propMeta.structuredFields}
          resolvedItems={resolvedItems ?? []}
          Picker={Picker}
          onChange={(v) => onChange(v)}
        />
      )}

      {controlType === 'array' && propMeta && (
        <ArrayEditor
          value={Array.isArray(value) ? value : []}
          propMeta={propMeta}
          resolvedItems={resolvedItems ?? []}
          Picker={Picker}
          onChange={onChange}
        />
      )}

      {controlType === 'readonly' && (
        <span style={{ fontSize: '11px', opacity: 0.4, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34d399', flexShrink: 0 }} />
          Event logged
        </span>
      )}
    </div>
  )
}
