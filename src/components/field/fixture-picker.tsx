'use client'

/**
 * Namespace-aware fixture selector for the children control in fixture mode.
 * Groups fixtures by plugin name, shows tabs to switch namespace,
 * then renders the appropriate selector (icon grid or dropdown).
 */

import { useState } from 'react'
import type { JcResolvedFixture } from '../../types.js'
import { IconPickerButton } from './icon-picker.js'
import { inputStyle } from './styles.js'

export function FixturePicker({
  value,
  fixtures,
  onChange,
}: {
  value: string | null
  fixtures: JcResolvedFixture[]
  onChange: (key: string | null) => void
}) {
  // Group fixtures by plugin namespace
  const namespaces = new Map<string, JcResolvedFixture[]>()
  for (const f of fixtures) {
    const group = namespaces.get(f.pluginName) ?? []
    group.push(f)
    namespaces.set(f.pluginName, group)
  }
  const namespaceNames = Array.from(namespaces.keys())

  // Derive initial namespace from current value, otherwise none selected
  const initialNs = value ? (fixtures.find((f) => f.qualifiedKey === value)?.pluginName ?? '') : ''
  const [selectedNs, setSelectedNs] = useState(initialNs)

  if (fixtures.length === 0) return null

  // Resolve active namespace (fall back to empty if selection is stale)
  const activeNs = selectedNs && namespaceNames.includes(selectedNs) ? selectedNs : ''
  const nsFixtures = activeNs ? (namespaces.get(activeNs) ?? []) : []
  const isIconCategory = nsFixtures.some((f) => f.category === 'icons' || f.category === 'icon')

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

      {/* Fixture picker — only shown after namespace is selected */}
      {activeNs &&
        (isIconCategory ? (
          <IconPickerButton
            value={value ?? ''}
            fixtures={nsFixtures}
            required={false}
            onChange={(key) => onChange(key || null)}
          />
        ) : (
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
        ))}
    </div>
  )
}
