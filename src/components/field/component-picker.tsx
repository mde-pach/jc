'use client'

/**
 * Component picker (fixture-aware).
 * If the matching plugin provides a `Picker` component, renders that.
 * Otherwise falls back to a simple dropdown select.
 * Plugin authors build their own pickers using jc's exported primitives
 * (e.g. GridPicker) or their own custom UI.
 */

import type { JcPluginPickerProps, JcResolvedPluginItem } from '../../types.js'
import { ErrorBoundary } from '../error-boundary.js'
import { inputStyle } from './styles.js'

export function ComponentPicker({
  value,
  resolvedItems,
  required,
  onChange,
  Picker,
}: {
  value: string
  resolvedItems: JcResolvedPluginItem[]
  required: boolean
  onChange: (key: string) => void
  Picker?: React.ComponentType<JcPluginPickerProps>
}) {
  // No fixtures available — text input fallback
  if (resolvedItems.length === 0) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="No fixtures available"
        style={inputStyle}
      />
    )
  }

  // Plugin provides its own picker — delegate fully, wrapped in ErrorBoundary
  if (Picker) {
    return (
      <ErrorBoundary componentName="Picker">
        <Picker items={resolvedItems} value={value} required={required} onChange={onChange} />
      </ErrorBoundary>
    )
  }

  // Default fallback: simple dropdown for all kinds
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
      <option value="">{required ? 'Select...' : '\u2014'}</option>
      {resolvedItems.map((f) => (
        <option key={f.qualifiedKey} value={f.qualifiedKey}>
          {f.label}
        </option>
      ))}
    </select>
  )
}
