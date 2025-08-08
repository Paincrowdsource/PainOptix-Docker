import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { generateErrorCode } from '@/lib/error-recovery';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCode: string;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCode: '',
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorCode: generateErrorCode(),
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { errorCode } = this.state;
    
    // Log error to monitoring service
    logger.error('React Error Boundary triggered', undefined, {
      error: {
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      errorCode,
      timestamp: new Date().toISOString()
    });

    // Update state with error info
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Store error in session storage for debugging
    if (typeof window !== 'undefined') {
      try {
        const errorData = {
          errorCode,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        };
        
        sessionStorage.setItem('painoptix_last_error', JSON.stringify(errorData));
      } catch (e) {
        // Ignore storage errors
      }
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorCode: '',
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-semibold text-gray-900 text-center mb-2">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 text-center mb-6">
              We apologize for the inconvenience. An error has occurred and we&apos;ve been notified.
            </p>

            <div className="bg-gray-50 rounded p-4 mb-6">
              <p className="text-sm text-gray-500 text-center">
                Error Code: <span className="font-mono font-semibold">{this.state.errorCode}</span>
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    Technical Details
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40 p-2 bg-white rounded">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-6">
              If this problem persists, please contact support with the error code above.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Medical Safety Error Boundary
 * Special error boundary for medical-related components
 */
export class MedicalSafetyBoundary extends ErrorBoundary {
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg border-2 border-red-300 p-8">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-semibold text-red-900 text-center mb-2">
              Safety Notice
            </h1>
            
            <p className="text-red-800 text-center mb-6 font-medium">
              For your safety, this assessment cannot continue due to a technical error.
            </p>

            <div className="bg-red-50 rounded p-4 mb-6">
              <p className="text-red-900 font-semibold mb-2">
                Please consult a healthcare provider directly.
              </p>
              <p className="text-sm text-red-700">
                Error Code: <span className="font-mono">{this.state.errorCode}</span>
              </p>
            </div>

            <div className="space-y-3">
              <a
                href="tel:911"
                className="w-full px-4 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                Call 911 for Emergencies
              </a>
              
              <button
                onClick={this.handleGoHome}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}