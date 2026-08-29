import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PLMSys Uncaught Error Boundary Catch:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetDatabase = async () => {
    if (window.confirm('This will reset local database storage to restore application state. Continue?')) {
      try {
        localStorage.clear();
        sessionStorage.clear();
        const databases = await window.indexedDB.databases?.() || [];
        for (const dbInfo of databases) {
          if (dbInfo.name) {
            window.indexedDB.deleteDatabase(dbInfo.name);
          }
        }
      } catch (e) {
        console.warn('Error clearing databases:', e);
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 bg-dark text-light d-flex align-items-center justify-content-center p-4" data-bs-theme="dark">
          <div className="card border-danger shadow-lg max-w-lg w-100 p-4 bg-[#0F1117] text-white rounded-xl">
            <div className="d-flex align-items-center gap-3 mb-3 text-danger">
              <div className="p-3 bg-danger/10 rounded-lg border border-danger/20">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="m-0 font-bold text-white">Application Encountered an Error</h4>
                <p className="text-muted small m-0">Plate Lifecycle Monitoring System (PLMSys)</p>
              </div>
            </div>

            <p className="text-secondary small mb-3">
              An unexpected display or runtime error occurred. You can reload the page or perform a safe database state repair.
            </p>

            {this.state.error && (
              <div className="p-3 bg-[#141720] border border-[#1E222A] rounded-md font-mono text-xs text-rose-300 mb-4 overflow-auto max-h-40">
                {this.state.error.toString()}
              </div>
            )}

            <div className="d-flex flex-column flex-sm-row gap-2 mt-2">
              <button
                onClick={this.handleReload}
                className="btn btn-primary d-flex items-center justify-content-center gap-2 flex-grow-1"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>

              <button
                onClick={this.handleResetDatabase}
                className="btn btn-outline-secondary text-light d-flex items-center justify-content-center gap-2"
              >
                <Database className="w-4 h-4" />
                Repair Local DB
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
