'use client'

import type { JcComponentMeta } from '../types.js'

interface ShowcaseSidebarProps {
  components: JcComponentMeta[]
  selectedName: string | null
  search: string
  onSearch: (search: string) => void
  onSelect: (name: string) => void
}

export function ShowcaseSidebar({
  components,
  selectedName,
  search,
  onSearch,
  onSelect,
}: ShowcaseSidebarProps) {
  const grouped = new Map<string, JcComponentMeta[]>()
  for (const comp of components) {
    const fileName = comp.filePath.split('/').pop()?.replace('.tsx', '') ?? 'unknown'
    const list = grouped.get(fileName) ?? []
    list.push(comp)
    grouped.set(fileName, list)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search */}
      <div style={{ padding: '12px', borderBottom: '1px solid var(--jc-border)' }}>
        <input
          type="text"
          placeholder="Search components..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          style={{
            height: '32px',
            width: '100%',
            borderRadius: '6px',
            border: '1px solid var(--jc-border)',
            backgroundColor: 'transparent',
            padding: '0 12px',
            fontSize: '11px',
            outline: 'none',
            color: 'inherit',
          }}
        />
      </div>

      {/* Component list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {[...grouped.entries()].map(([fileName, comps]) => (
          <div key={fileName} style={{ marginBottom: '4px' }}>
            <div style={{ padding: '4px 12px' }}>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  opacity: 0.3,
                }}
              >
                {fileName}
              </span>
            </div>
            {comps.map((comp) => {
              const propCount = Object.keys(comp.props).length
              const isSelected = comp.displayName === selectedName
              return (
                <button
                  key={comp.displayName}
                  type="button"
                  onClick={() => onSelect(comp.displayName)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 12px',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s',
                    backgroundColor: isSelected ? 'color-mix(in srgb, var(--jc-accent) 12%, transparent)' : 'transparent',
                    color: isSelected ? 'var(--jc-accent)' : 'inherit',
                    fontWeight: isSelected ? 500 : 400,
                    opacity: isSelected ? 1 : 0.7,
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {comp.displayName}
                  </span>
                  {propCount > 0 && (
                    <span style={{ fontSize: '9px', opacity: 0.3, marginLeft: '8px', flexShrink: 0 }}>
                      {propCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}

        {components.length === 0 && (
          <p style={{ fontSize: '11px', opacity: 0.4, textAlign: 'center', padding: '32px 0' }}>
            No components found
          </p>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--jc-border)', padding: '8px 12px' }}>
        <span style={{ fontSize: '9px', opacity: 0.3 }}>
          {components.length} component{components.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
