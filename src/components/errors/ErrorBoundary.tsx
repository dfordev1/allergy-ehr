// ============================================================================
// COMPREHENSIVE ERROR BOUNDARY SYSTEM
// ============================================================================

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  Bug, 
  Home, 
  ArrowLeft,
  Copy,
  Download,
  Shield
} from 'lucide-react';
import { handleError, ErrorCode, ErrorSeverity } from '@/lib/errors';
import { toast } from 'sonner';

// ============================================================================
// ERROR BOUNDARY TYPES
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  showDetails: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
  context?: string;
  enableRetry?: boolean;
  maxRetries?: number;
  showErrorDetails?: boolean;
}

// ============================================================================
// MAIN ERROR BOUNDARY CLASS
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Handle error through our error system
    const appError = handleError(error, this.props.context || 'ErrorBoundary');
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log detailed error information
    console.group(`🚨 Error Boundary Caught Error [${this.state.errorId}]`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Props:', this.props);
    console.groupEnd();

    // Report critical errors
    if (this.props.level === 'critical') {
      this.reportCriticalError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryState) {
    // Auto-retry for component level errors
    if (
      this.state.hasError && 
      !prevState.hasError &&
      this.props.enableRetry !== false &&
      this.props.level === 'component' &&
      this.state.retryCount < (this.props.maxRetries || 3)
    ) {
      this.scheduleRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private scheduleRetry = () => {
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // Exponential backoff, max 10s
    
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      showDetails: false
    }));

    toast.info(`Retrying... (Attempt ${this.state.retryCount + 1})`);
  };

  private handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      showDetails: false
    });

    toast.info('Retrying...');
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleGoBack = () => {
    window.history.back();
  };

  private handleCopyError = async () => {
    const errorDetails = this.getErrorDetails();
    try {
      await navigator.clipboard.writeText(errorDetails);
      toast.success('Error details copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy error details');
    }
  };

  private handleDownloadErrorReport = () => {
    const errorDetails = this.getErrorDetails();
    const blob = new Blob([errorDetails], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${this.state.errorId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Error report downloaded');
  };

  private toggleDetails = () => {
    this.setState(prevState => ({ showDetails: !prevState.showDetails }));
  };

  private reportCriticalError = (error: Error, errorInfo: ErrorInfo) => {
    // TODO: Send to external error reporting service (Sentry, Bugsnag, etc.)
    console.error('CRITICAL ERROR REPORTED:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  };

  private getErrorDetails = (): string => {
    const { error, errorInfo, errorId } = this.state;
    
    return `
AllergyEHR Error Report
=======================
Error ID: ${errorId}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Context: ${this.props.context || 'Unknown'}
Level: ${this.props.level || 'component'}

Error Message:
${error?.message || 'Unknown error'}

Stack Trace:
${error?.stack || 'No stack trace available'}

Component Stack:
${errorInfo?.componentStack || 'No component stack available'}

Props:
${JSON.stringify(this.props, null, 2)}
    `.trim();
  };

  private getErrorSeverity = (): ErrorSeverity => {
    switch (this.props.level) {
      case 'critical':
        return ErrorSeverity.CRITICAL;
      case 'page':
        return ErrorSeverity.HIGH;
      case 'component':
      default:
        return ErrorSeverity.MEDIUM;
    }
  };

  private getErrorIcon = () => {
    const severity = this.getErrorSeverity();
    const iconClass = "h-8 w-8";
    
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return <Shield className={`${iconClass} text-red-600`} />;
      case ErrorSeverity.HIGH:
        return <AlertTriangle className={`${iconClass} text-orange-500`} />;
      default:
        return <Bug className={`${iconClass} text-yellow-500`} />;
    }
  };

  private getSeverityBadge = () => {
    const severity = this.getErrorSeverity();
    
    const variants = {
      [ErrorSeverity.CRITICAL]: 'destructive',
      [ErrorSeverity.HIGH]: 'secondary',
      [ErrorSeverity.MEDIUM]: 'outline',
      [ErrorSeverity.LOW]: 'outline'
    } as const;

    return (
      <Badge variant={variants[severity]}>
        {severity} ERROR
      </Badge>
    );
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId, retryCount, showDetails } = this.state;
      const maxRetries = this.props.maxRetries || 3;
      const canRetry = this.props.enableRetry !== false && retryCount < maxRetries;
      const isComponentLevel = this.props.level === 'component';
      const severity = this.getErrorSeverity();

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                {this.getErrorIcon()}
              </div>
              
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                Something went wrong
                {this.getSeverityBadge()}
              </CardTitle>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Error ID: <code className="text-xs bg-muted px-2 py-1 rounded">{errorId}</code></p>
                {retryCount > 0 && (
                  <p>Retry attempts: {retryCount}/{maxRetries}</p>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error Message */}
              <Alert variant={severity === ErrorSeverity.CRITICAL ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {error?.message || 'An unexpected error occurred'}
                  {this.props.context && (
                    <><br /><strong>Context:</strong> {this.props.context}</>
                  )}
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-center">
                {canRetry && (
                  <Button onClick={this.handleManualRetry} variant="default">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}
                
                {!isComponentLevel && (
                  <>
                    <Button onClick={this.handleGoBack} variant="outline">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Go Back
                    </Button>
                    
                    <Button onClick={this.handleGoHome} variant="outline">
                      <Home className="h-4 w-4 mr-2" />
                      Go Home
                    </Button>
                  </>
                )}
              </div>

              {/* Developer Tools */}
              {(this.props.showErrorDetails !== false || process.env.NODE_ENV === 'development') && (
                <div className="border-t pt-4 space-y-2">
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={this.toggleDetails} 
                      variant="ghost" 
                      size="sm"
                    >
                      <Bug className="h-4 w-4 mr-2" />
                      {showDetails ? 'Hide' : 'Show'} Details
                    </Button>
                    
                    <Button 
                      onClick={this.handleCopyError} 
                      variant="ghost" 
                      size="sm"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Error
                    </Button>
                    
                    <Button 
                      onClick={this.handleDownloadErrorReport} 
                      variant="ghost" 
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                  </div>

                  {showDetails && (
                    <div className="bg-muted p-4 rounded-lg text-sm font-mono overflow-auto max-h-64">
                      <pre className="whitespace-pre-wrap">
                        {this.getErrorDetails()}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Help Text */}
              <div className="text-center text-sm text-muted-foreground">
                {severity === ErrorSeverity.CRITICAL ? (
                  <p>This is a critical error. Please contact support if the problem persists.</p>
                ) : (
                  <p>If this problem continues, please try refreshing the page or contact support.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// SPECIALIZED ERROR BOUNDARIES
// ============================================================================

export const PageErrorBoundary: React.FC<{ children: ReactNode; pageName?: string }> = ({ 
  children, 
  pageName 
}) => (
  <ErrorBoundary
    level="page"
    context={pageName ? `Page: ${pageName}` : 'Page'}
    enableRetry={true}
    maxRetries={2}
  >
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ 
  children: ReactNode; 
  componentName?: string;
  fallback?: ReactNode;
}> = ({ 
  children, 
  componentName,
  fallback 
}) => (
  <ErrorBoundary
    level="component"
    context={componentName ? `Component: ${componentName}` : 'Component'}
    enableRetry={true}
    maxRetries={3}
    fallback={fallback}
  >
    {children}
  </ErrorBoundary>
);

export const CriticalErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="critical"
    context="Critical System"
    enableRetry={false}
    showErrorDetails={true}
  >
    {children}
  </ErrorBoundary>
);

// ============================================================================
// ERROR BOUNDARY HOOK
// ============================================================================

export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    setError(errorObj);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

// ============================================================================
// ASYNC ERROR BOUNDARY
// ============================================================================

export const AsyncErrorBoundary: React.FC<{
  children: ReactNode;
  onError?: (error: Error) => void;
}> = ({ children, onError }) => {
  const { captureError } = useErrorBoundary();

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      captureError(error);
      if (onError) onError(error);
    };

    const handleError = (event: ErrorEvent) => {
      const error = event.error instanceof Error ? event.error : new Error(event.message);
      captureError(error);
      if (onError) onError(error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [captureError, onError]);

  return <>{children}</>;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default ErrorBoundary;