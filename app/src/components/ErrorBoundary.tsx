import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("NetworkPanel_Crash_Detected:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="border border-red-900 bg-red-900/10 p-4 font-mono">
          <h2 className="text-[10px] text-red-500 uppercase mb-2">
            [!] {this.props.fallbackTitle || 'Component_Failure'}
          </h2>
          <p className="text-[9px] text-red-400 opacity-70 mb-4">
            Reason: {this.state.error?.message || 'Unknown_Network_Error'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="text-[9px] bg-red-900/40 border border-red-500 px-2 py-1 text-red-200 hover:bg-red-500 hover:text-white transition-all"
          >
            REBOOT_SUBSYSTEM
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

