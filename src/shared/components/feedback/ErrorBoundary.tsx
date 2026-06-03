'use client';

import React from 'react';
import { ErrorState } from '@shared/components/data-display/EmptyState';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
      };
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', JSON.stringify(errorDetails, null, 2));
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <ErrorState
            {...(this.state.error ? { error: this.state.error } : {})}
            onRetry={this.handleReset}
          />

          {process.env.NODE_ENV !== 'production' && this.state.error?.stack && (
            <details className="mt-4 text-xs font-mono bg-[var(--bg-table-header)] border border-[var(--color-border)] rounded-lg p-3 text-[var(--color-text-muted)]">
              <summary className="cursor-pointer font-medium mb-2 text-[var(--color-text-secondary)]">
                Stack trace (dev only)
              </summary>
              <pre className="overflow-x-auto whitespace-pre-wrap break-all">
                {this.state.error.stack}
              </pre>
            </details>
          )}

          <button
            onClick={this.handleReload}
            className="mt-3 w-full px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--bg-sidebar-item-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
