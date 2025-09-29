// hotfix: loop load guard - Error Boundary leggero per stabilità
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-app-bg flex items-center justify-center">
          <div className="text-center p-6">
            <div className="text-app-text-muted mb-4">
              Si è verificato un errore imprevisto
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-app-accent text-white rounded hover:bg-opacity-90"
            >
              Ricarica pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
