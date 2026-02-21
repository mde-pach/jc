'use client'

import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  componentName: string
  children: ReactNode
}
interface ErrorBoundaryState {
  error: string | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(err: Error) {
    return { error: err.message }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.componentName !== this.props.componentName) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            fontSize: '11px',
            color: '#ef4444',
            padding: '8px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontWeight: 500, margin: 0 }}>Render error</p>
          <p style={{ opacity: 0.5, marginTop: '4px' }}>{this.state.error}</p>
        </div>
      )
    }
    return this.props.children
  }
}
