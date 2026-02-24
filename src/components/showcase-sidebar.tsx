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
  // Find common prefix to strip from paths (e.g. 'src/components/')
  const allDirs = components.map((c) => c.filePath.replace(/\/[^/]+$/, ''))
  const commonPrefix =
    allDirs.length > 0
      ? allDirs.reduce((prefix, dir) => {
          while (dir && !dir.startsWith(prefix)) {
            prefix = prefix.replace(/[^/]*\/$/, '')
          }
          return prefix
        }, `${allDirs[0]}/`)
      : ''
  for (const comp of components) {
    const relativeDir = comp.filePath.slice(commonPrefix.length).replace(/\/[^/]+$/, '')
    // Use the last folder segment as group label
    const groupLabel = relativeDir.split('/').pop() || relativeDir
    const list = grouped.get(groupLabel) ?? []
    list.push(comp)
    grouped.set(groupLabel, list)
  }
  // Sort groups alphabetically
  const sortedGroups = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search */}
      <div style={{ padding: '7px 12px', borderBottom: '1px solid var(--jc-border)' }}>
        <input
          type="text"
          placeholder="Search components..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          style={{
            height: '28px',
            width: '100%',
            boxSizing: 'border-box',
            borderRadius: '6px',
            border: '1px solid var(--jc-border)',
            backgroundColor: 'transparent',
            padding: '0 10px',
            fontSize: '11px',
            outline: 'none',
            color: 'inherit',
          }}
        />
      </div>

      {/* Component list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {sortedGroups.map(([groupLabel, comps]) => (
          <div key={groupLabel} style={{ marginBottom: '4px' }}>
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
                {groupLabel}
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
                    backgroundColor: isSelected
                      ? 'color-mix(in srgb, var(--jc-accent) 12%, transparent)'
                      : 'transparent',
                    color: isSelected ? 'var(--jc-accent)' : 'inherit',
                    fontWeight: isSelected ? 500 : 400,
                    opacity: isSelected ? 1 : 0.7,
                  }}
                >
                  <span
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {comp.displayName}
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexShrink: 0,
                      marginLeft: '8px',
                    }}
                  >
                    {comp.usageCount && comp.usageCount.total > 0 && (
                      <span
                        style={{ fontSize: '9px', opacity: 0.35 }}
                        title={`${comp.usageCount.direct} direct + ${comp.usageCount.indirect} indirect usages`}
                      >
                        ×{comp.usageCount.total}
                      </span>
                    )}
                    {propCount > 0 && (
                      <span style={{ fontSize: '9px', opacity: 0.3 }}>{propCount}</span>
                    )}
                  </span>
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
