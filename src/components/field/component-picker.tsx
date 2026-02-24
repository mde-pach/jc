'use client'

/**
 * Component picker (fixture-aware).
 * For 'icon' kind: renders an icon picker grid.
 * For 'element'/'node' kind: renders a dropdown select.
 * Falls back to a plain text input when no fixtures are provided.
 */

import type { JcResolvedFixture } from '../../types.js'
import { IconPickerButton } from './icon-picker.js'
import { inputStyle } from './styles.js'

export function ComponentPicker({
  value,
  kind,
  fixtures,
  required,
  onChange,
}: {
  value: string
  kind: 'icon' | 'element' | 'node'
  fixtures: JcResolvedFixture[]
  required: boolean
  onChange: (key: string) => void
}) {
  // No fixtures available — text input fallback
  if (fixtures.length === 0) {
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

  if (kind === 'icon') {
    return (
      <IconPickerButton value={value} fixtures={fixtures} required={required} onChange={onChange} />
    )
  }

  // Dropdown for element/node types
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
      <option value="">{required ? 'Select...' : '\u2014'}</option>
      {fixtures.map((f) => (
        <option key={f.qualifiedKey} value={f.qualifiedKey}>
          {f.label}
        </option>
      ))}
    </select>
  )
}
