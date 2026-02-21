/** A styled monospace code block for displaying terminal commands or source code. */
export interface CodeBlockProps {
  /** The code content to display */
  code: string
  /** Whether to show a compact inline-style block */
  inline?: boolean
}

export function CodeBlock({ code, inline = false }: CodeBlockProps) {
  return (
    <pre
      style={{
        fontFamily: '"SF Mono", "Fira Code", "Fira Mono", Menlo, monospace',
        fontSize: inline ? '14px' : '13px',
        lineHeight: 1.7,
        backgroundColor: '#0f172a',
        color: '#e2e8f0',
        borderRadius: '12px',
        padding: inline ? '14px 24px' : '20px 24px',
        overflow: 'auto',
        border: '1px solid #1e293b',
        margin: 0,
        ...(inline ? { display: 'inline-block' } : {}),
      }}
    >
      <code>{code}</code>
    </pre>
  )
}
