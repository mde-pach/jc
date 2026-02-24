/**
 * A minimal data table for displaying structured information.
 *
 * @example <DataTable columns={["Name", "Role"]} rows={[["Alice", "Admin"], ["Bob", "Editor"]]} striped />
 * @example <DataTable columns={["Command", "Description"]} rows={[["dev", "Start dev server"], ["build", "Production build"]]} monoFirstCol />
 */
export interface DataTableProps {
  /** Column header labels */
  columns: string[]
  /** Row data (array of arrays matching column count) */
  rows: string[][]
  /** Render first column in monospace font */
  monoFirstCol?: boolean
  /** Alternate row backgrounds */
  striped?: boolean
}

/** A minimal data table for displaying structured information. */
export function DataTable({
  columns,
  rows,
  monoFirstCol = false,
  striped = false,
}: DataTableProps) {
  return (
    <div className="overflow-auto rounded-lg border border-border">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border bg-surface-raised">
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-2.5 text-left text-xs font-semibold text-fg-subtle uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`border-b border-border last:border-0 ${striped && i % 2 === 1 ? 'bg-surface-raised/50' : ''}`}
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-2.5 text-fg-muted ${j === 0 && monoFirstCol ? 'font-mono text-accent text-xs' : ''}`}
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
