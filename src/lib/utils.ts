/** Convert a label string to PascalCase (e.g. "status badge" → "StatusBadge") */
export function toPascalCase(label: string): string {
  return label
    .split(/[\s-]+/)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('')
}
