'use client'

/**
 * ReactNode field with text/fixture toggle — mirrors the children control pattern.
 * Text mode: plain text input. Fixture mode: FixturePicker with namespace tabs.
 * The stored value is a plain string in text mode or a fixture qualified key in fixture mode.
 */

import { useState } from 'react'
import type { JcResolvedPluginItem } from '../../types.js'
import { FixturePicker } from './fixture-picker.js'
import { inputStyle } from './styles.js'

export function NodePicker({
  value,
  resolvedItems,
  onChange,
}: {
  value: unknown
  resolvedItems: JcResolvedPluginItem[]
  onChange: (value: unknown) => void
}) {
  const hasFixtures = resolvedItems.length > 0
  const isFixtureKey = typeof value === 'string' && resolvedItems.some((f) => f.qualifiedKey === value)
  const [mode, setMode] = useState<'text' | 'fixture'>('text')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {hasFixtures && (
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            type="button"
            onClick={() => setMode('text')}
            style={{
              fontSize: '8px',
              fontWeight: 500,
              padding: '1px 5px',
              borderRadius: '3px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor:
                mode === 'text'
                  ? 'color-mix(in srgb, var(--jc-accent) 15%, transparent)'
                  : 'transparent',
              color: mode === 'text' ? 'var(--jc-accent)' : 'inherit',
              opacity: mode === 'text' ? 1 : 0.5,
              transition: 'all 0.1s',
            }}
          >
            Text
          </button>
          <button
            type="button"
            onClick={() => setMode('fixture')}
            style={{
              fontSize: '8px',
              fontWeight: 500,
              padding: '1px 5px',
              borderRadius: '3px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor:
                mode === 'fixture'
                  ? 'color-mix(in srgb, var(--jc-accent) 15%, transparent)'
                  : 'transparent',
              color: mode === 'fixture' ? 'var(--jc-accent)' : 'inherit',
              opacity: mode === 'fixture' ? 1 : 0.5,
              transition: 'all 0.1s',
            }}
          >
            Fixture
          </button>
        </div>
      )}
      {mode === 'text' ? (
        <input
          type="text"
          value={typeof value === 'string' && !isFixtureKey ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      ) : (
        <FixturePicker
          value={typeof value === 'string' ? value : null}
          resolvedItems={resolvedItems}
          onChange={(key) => onChange(key ?? undefined)}
        />
      )}
    </div>
  )
}
