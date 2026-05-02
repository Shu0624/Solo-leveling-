import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="glass-morphism rounded-3xl p-10 max-w-lg text-center shadow-2xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">
              An unexpected error occurred. Don't worry — your data is safe.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:opacity-90 transition-all"
              >
                Reload Page
              </button>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.history.back(); }}
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-all"
              >
                Go Back
              </button>
            </div>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Technical Details</summary>
                <pre className="mt-2 p-3 bg-background rounded-lg text-xs text-destructive overflow-auto max-h-32 border border-border">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
