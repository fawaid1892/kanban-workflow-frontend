'use client';

import React, { Component, type ReactNode, useState } from 'react';
import { AlertTriangle, Copy, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorId: `ERR-${Date.now().toString(36).toUpperCase()}` };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorId: '' });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorId={this.state.errorId}
          onReset={this.handleReset}
          onReload={() => window.location.reload()}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, errorId, onReset, onReload }: { error: Error | null; errorId: string; onReset: () => void; onReload: () => void }) {
  const [copied, setCopied] = useState(false);

  const copyError = () => {
    const text = `Error ID: ${errorId}\nMessage: ${error?.message}\nTime: ${new Date().toISOString()}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6 dark:bg-gray-900">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Something went wrong
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Error ID: {errorId}
        </p>
        <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
          {error?.message || 'An unexpected error occurred'}
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
          <button
            type="button"
            onClick={copyError}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? 'Copied!' : 'Copy Error'}
          </button>
          <button
            type="button"
            onClick={onReload}
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
