'use client'

/**
 * Generic array editor.
 * Renders a list of items with per-item inputs inferred from the
 * array's item type. Supports string, number, boolean, and
 * component items (via plugin picker or dropdown).
 */

import { generateFakeValue, getArrayItemType } from '../../lib/faker-map.js'
import type { JcPropMeta, JcResolvedPluginItem, JcStructuredField } from '../../types.js'
import { ComponentPicker } from './component-picker.js'
import { NodeFieldInput } from './node-field-input.js'
import { inputStyle } from './styles.js'

export function ArrayEditor({
  value,
  propMeta,
  resolvedItems,
  Picker,
  onChange,
}: {
  value: unknown[]
  propMeta: JcPropMeta
  resolvedItems: JcResolvedPluginItem[]
  // biome-ignore lint/suspicious/noExplicitAny: plugin picker components are user-defined with varying prop shapes
  Picker?: React.ComponentType<any>
  onChange: (value: unknown) => void
}) {
  const itemInfo = getArrayItemType(propMeta)
  const itemType = itemInfo?.itemType ?? 'string'
  const isComponent = itemInfo?.isComponent ?? false
  const structuredFields = itemInfo?.structuredFields

  const updateItem = (index: number, newVal: unknown) => {
    const next = [...value]
    next[index] = newVal
    onChange(next)
  }

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const addItem = () => {
    if (structuredFields) {
      // Build a new object with per-field defaults
      const obj: Record<string, unknown> = {}
      for (const field of structuredFields) {
        if (field.isComponent) {
          obj[field.name] = undefined
        } else {
          const synth: JcPropMeta = {
            name: field.name,
            type: field.type,
            required: !field.optional,
            description: '',
            isChildren: false,
            ...(field.values ? { values: field.values } : {}),
            ...(field.fields ? { structuredFields: field.fields } : {}),
          }
          obj[field.name] = generateFakeValue(field.name, synth)
        }
      }
      onChange([...value, obj])
    } else if (isComponent) {
      // Add first fixture key or empty string
      onChange([...value, resolvedItems[0]?.qualifiedKey ?? ''])
    } else if (itemType === 'number') {
      onChange([...value, 0])
    } else if (itemType === 'boolean') {
      onChange([...value, false])
    } else {
      onChange([...value, ''])
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {value.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: '4px',
            alignItems: structuredFields ? 'flex-start' : 'center',
          }}
        >
          <span
            style={{
              fontSize: '9px',
              opacity: 0.3,
              fontFamily: 'monospace',
              width: '14px',
              textAlign: 'right',
              flexShrink: 0,
              paddingTop: structuredFields ? '6px' : 0,
            }}
          >
            {i}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            {structuredFields ? (
              <StructuredItemEditor
                item={item as Record<string, unknown>}
                fields={structuredFields}
                resolvedItems={resolvedItems}
                Picker={Picker}
                onChange={(v) => updateItem(i, v)}
              />
            ) : (
              <ArrayItemInput
                value={item}
                itemType={itemType}
                isComponent={isComponent}
                resolvedItems={resolvedItems}
                Picker={Picker}
                onChange={(v) => updateItem(i, v)}
              />
            )}
          </div>
          <button
            type="button"
            onClick={() => removeItem(i)}
            title="Remove item"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '3px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'inherit',
              opacity: 0.3,
              fontSize: '12px',
              flexShrink: 0,
              marginTop: structuredFields ? '4px' : 0,
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          height: '26px',
          borderRadius: '4px',
          border: '1px dashed var(--jc-border)',
          backgroundColor: 'transparent',
          color: 'inherit',
          fontSize: '10px',
          opacity: 0.5,
          cursor: 'pointer',
          transition: 'opacity 0.1s',
        }}
      >
        + Add item
      </button>
    </div>
  )
}

// ── Structured item editor ───────────────────────────────────

export function StructuredItemEditor({
  item,
  fields,
  resolvedItems,
  Picker,
  onChange,
}: {
  item: Record<string, unknown>
  fields: JcStructuredField[]
  resolvedItems: JcResolvedPluginItem[]
  // biome-ignore lint/suspicious/noExplicitAny: plugin picker components are user-defined with varying prop shapes
  Picker?: React.ComponentType<any>
  onChange: (value: Record<string, unknown>) => void
}) {
  const updateField = (fieldName: string, fieldValue: unknown) => {
    onChange({ ...item, [fieldName]: fieldValue })
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
        padding: '6px 8px',
        borderRadius: '4px',
        border: '1px solid var(--jc-border)',
        backgroundColor: 'color-mix(in srgb, var(--jc-bg) 50%, transparent)',
      }}
    >
      {fields.map((field) => (
        <div key={field.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '9px',
              opacity: 0.5,
              fontFamily: 'monospace',
              width: '50px',
              flexShrink: 0,
              textAlign: 'right',
            }}
          >
            {field.name}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <StructuredFieldInput
              field={field}
              value={item[field.name]}
              resolvedItems={resolvedItems}
              Picker={Picker}
              onChange={(v) => updateField(field.name, v)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Per-field input for a structured object — dispatches based on field type.
 * - Component fields -> ComponentPicker (delegates to plugin Picker if available)
 * - Node-kind components (ReactNode) -> text/fixture toggle
 * - Primitives -> matching input (text, number, boolean)
 */
function StructuredFieldInput({
  field,
  value,
  resolvedItems,
  Picker,
  onChange,
}: {
  field: JcStructuredField
  value: unknown
  resolvedItems: JcResolvedPluginItem[]
  // biome-ignore lint/suspicious/noExplicitAny: plugin picker components are user-defined with varying prop shapes
  Picker?: React.ComponentType<any>
  onChange: (value: unknown) => void
}) {
  // Component field with a plugin picker (e.g. icons, avatars) -> delegate to plugin
  if (field.isComponent && Picker) {
    return (
      <ComponentPicker
        value={String(value ?? '')}
        resolvedItems={resolvedItems}
        required={!field.optional}
        onChange={(v) => onChange(v)}
        Picker={Picker}
      />
    )
  }

  // Component field without plugin picker -> text/fixture toggle
  if (field.isComponent) {
    return <NodeFieldInput value={value} resolvedItems={resolvedItems} onChange={onChange} />
  }

  // Nested structured object (e.g. `address: Address` with sub-fields) → recursive editor
  if (field.fields && field.fields.length > 0) {
    const obj =
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {}
    return (
      <StructuredItemEditor
        item={obj}
        fields={field.fields}
        resolvedItems={resolvedItems}
        onChange={(v) => onChange(v)}
      />
    )
  }

  // Enum / string literal union → select dropdown
  if (field.values && field.values.length > 0) {
    return (
      <select
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      >
        {field.optional && <option value="">—</option>}
        {field.values.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    )
  }

  // Boolean
  if (field.type === 'boolean') {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          ...inputStyle,
          cursor: 'pointer',
          textAlign: 'left',
          color: value ? 'var(--jc-accent)' : 'inherit',
          opacity: value ? 1 : 0.5,
        }}
      >
        {value ? 'true' : 'false'}
      </button>
    )
  }

  // Number
  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={Number(value ?? 0)}
        onChange={(e) => onChange(Number(e.target.value))}
        style={inputStyle}
      />
    )
  }

  // Default — text
  return (
    <input
      type="text"
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
    />
  )
}

/** Per-item input — renders the right control based on the array's item type */
function ArrayItemInput({
  value,
  itemType,
  isComponent,
  resolvedItems,
  Picker,
  onChange,
}: {
  value: unknown
  itemType: string
  isComponent: boolean
  resolvedItems: JcResolvedPluginItem[]
  // biome-ignore lint/suspicious/noExplicitAny: plugin picker components are user-defined with varying prop shapes
  Picker?: React.ComponentType<any>
  onChange: (value: unknown) => void
}) {
  // Component items — delegate to plugin Picker or fallback dropdown
  if (isComponent && resolvedItems.length > 0) {
    return (
      <ComponentPicker
        value={String(value ?? '')}
        resolvedItems={resolvedItems}
        required={true}
        onChange={(v) => onChange(v)}
        Picker={Picker}
      />
    )
  }

  // Number items
  if (itemType === 'number') {
    return (
      <input
        type="number"
        value={Number(value ?? 0)}
        onChange={(e) => onChange(Number(e.target.value))}
        style={inputStyle}
      />
    )
  }

  // Boolean items
  if (itemType === 'boolean') {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          ...inputStyle,
          cursor: 'pointer',
          textAlign: 'left',
          color: value ? 'var(--jc-accent)' : 'inherit',
          opacity: value ? 1 : 0.5,
        }}
      >
        {value ? 'true' : 'false'}
      </button>
    )
  }

  // Default — string input
  return (
    <input
      type="text"
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
    />
  )
}
