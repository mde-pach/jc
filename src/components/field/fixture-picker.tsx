'use client'

/**
 * Namespace-aware fixture selector for the children control in fixture mode.
 * Groups fixtures by plugin name, shows tabs to switch namespace,
 * then renders a dropdown selector for the chosen namespace.
 *
 * Note: plugin-specific pickers (grids, etc.) are handled by the plugin's
 * own Picker component via ComponentPicker. FixturePicker is used in contexts
 * where we need a generic namespace-scoped selector (e.g. children slots).
 */

import { useState } from 'react'
import type { JcResolvedPluginItem } from '../../types.js'
import { inputStyle } from './styles.js'

export function FixturePicker({
  value,
  resolvedItems,
  onChange,
}: {
  value: string | null
  resolvedItems: JcResolvedPluginItem[]
  onChange: (key: string | null) => void
}) {
  // Group fixtures by plugin namespace
  const namespaces = new Map<string, JcResolvedPluginItem[]>()
  for (const f of resolvedItems) {
    const group = namespaces.get(f.pluginName) ?? []
    group.push(f)
    namespaces.set(f.pluginName, group)
  }
  const namespaceNames = Array.from(namespaces.keys())

  // Derive initial namespace from current value, otherwise none selected
  const initialNs = value ? (resolvedItems.find((f) => f.qualifiedKey === value)?.pluginName ?? '') : ''
  const [selectedNs, setSelectedNs] = useState(initialNs)

  if (resolvedItems.length === 0) return null

  // Resolve active namespace (fall back to empty if selection is stale)
  const activeNs = selectedNs && namespaceNames.includes(selectedNs) ? selectedNs : ''
  const nsFixtures = activeNs ? (namespaces.get(activeNs) ?? []) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Namespace selector — always shown */}
      <select
        value={activeNs}
        onChange={(e) => {
          setSelectedNs(e.target.value)
          // Clear fixture selection when switching namespace
          if (e.target.value !== activeNs) onChange(null)
        }}
        style={inputStyle}
      >
        <option value="">Select a category...</option>
        {namespaceNames.map((ns) => (
          <option key={ns} value={ns}>
            {ns}
          </option>
        ))}
      </select>

      {/* Fixture picker — dropdown for the selected namespace */}
      {activeNs && (
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          style={inputStyle}
        >
          <option value="">Select a fixture...</option>
          {nsFixtures.map((f) => (
            <option key={f.qualifiedKey} value={f.qualifiedKey}>
              {f.label}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
