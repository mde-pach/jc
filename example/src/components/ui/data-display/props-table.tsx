/** A structured table for displaying prop/option definitions. */
export interface PropsTableProps {
  /** Column header labels */
  columns: string[]
  /** Row data — each row is an array of cell strings matching the columns */
  rows: string[][]
  /** Whether the first column should be monospace-styled */
  monoFirstCol?: boolean
}

export function PropsTable({ columns, rows, monoFirstCol = true }: PropsTableProps) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          fontSize: '13px',
          borderCollapse: 'separate',
          borderSpacing: 0,
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f9fafb' }}>
            {columns.map((col) => (
              <th
                key={col}
                style={{
                  textAlign: 'left',
                  padding: '10px 16px',
                  fontWeight: 600,
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: '8px 16px',
                    borderBottom: ri < rows.length - 1 ? '1px solid #f3f4f6' : 'none',
                    color: ci === 0 && monoFirstCol ? '#111827' : '#6b7280',
                    fontFamily: ci === 0 && monoFirstCol ? '"SF Mono", Menlo, monospace' : 'inherit',
                    fontWeight: ci === 0 && monoFirstCol ? 500 : 400,
                    fontSize: ci === 0 && monoFirstCol ? '12px' : '13px',
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
