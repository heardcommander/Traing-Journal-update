import { ReactNode, Component } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error("ErrorBoundary caught:", error);
    console.error("Component stack:", errorInfo.componentStack);
    this.setState({
      errorInfo,
    });
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full">
            <div className="bg-card border border-card-border rounded-lg p-8 shadow-lg">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground text-center mb-2">
                Something went wrong
              </h1>
              <p className="text-muted-foreground text-center mb-6">
                An unexpected error occurred. Try refreshing the page or going back.
              </p>

              {this.state.error && (
                <div className="mb-6 p-3 bg-muted rounded border border-border">
                  <p className="text-xs font-mono text-muted-foreground break-words line-clamp-3">
                    {this.state.error.message || this.state.error.toString()}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={this.reset}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = "/"}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  Home
                </button>
              </div>

              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="mt-4 text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Stack trace (dev only)
                  </summary>
                  <pre className="mt-2 text-xs text-muted-foreground bg-muted p-3 rounded overflow-auto max-h-48 whitespace-pre-wrap break-words">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
