import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  isolationLevel?: 'component' | 'page' | 'section';
  componentName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showErrorDetails?: boolean;
  allowRetry?: boolean;
  allowNavigation?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  errorId: string;
}

export class ResilientErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { componentName, onError, isolationLevel } = this.props;
    
    console.error(`Error in ${componentName || 'Component'} (${isolationLevel || 'component'}):`, error, errorInfo);
    
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
    
    // Log error for monitoring
    this.logError(error, errorInfo);
    
    // Show toast notification based on isolation level
    this.showErrorNotification(error, isolationLevel);
  }

  private logError = (error: Error, errorInfo: React.ErrorInfo) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      componentName: this.props.componentName,
      isolationLevel: this.props.isolationLevel,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      errorId: this.state.errorId
    };
    
    // Store in localStorage for debugging
    const existingErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
    existingErrors.push(errorReport);
    
    // Keep only last 50 errors
    if (existingErrors.length > 50) {
      existingErrors.splice(0, existingErrors.length - 50);
    }
    
    localStorage.setItem('app_errors', JSON.stringify(existingErrors));
    
    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: this.props.isolationLevel === 'page',
        error_id: this.state.errorId
      });
    }
  };

  private showErrorNotification = (error: Error, isolationLevel?: string) => {
    switch (isolationLevel) {
      case 'component':
        toast.error(`Component error: ${error.message}`, {
          description: 'This section may not work properly, but other parts of the app should function normally.'
        });
        break;
      case 'section':
        toast.error(`Section error: ${error.message}`, {
          description: 'This section is temporarily unavailable. Other features continue to work.'
        });
        break;
      case 'page':
        toast.error(`Page error: ${error.message}`, {
          description: 'This page encountered an error. You can navigate to other pages.'
        });
        break;
      default:
        toast.error(`Error: ${error.message}`);
    }
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= this.maxRetries) {
      toast.error('Maximum retry attempts reached');
      return;
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1
    });
    
    toast.info('Retrying...');
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.handleGoHome();
    }
  };

  private renderErrorUI() {
    const { 
      isolationLevel = 'component', 
      componentName, 
      showErrorDetails = false,
      allowRetry = true,
      allowNavigation = true
    } = this.props;
    const { error, errorInfo, retryCount, errorId } = this.state;

    const isComponentLevel = isolationLevel === 'component';
    const canRetry = allowRetry && retryCount < this.maxRetries;

    return (
      <Card className={`border-red-200 ${isComponentLevel ? 'bg-red-50/50' : 'bg-red-50'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-800">
                {isComponentLevel ? 'Component Error' : 'Section Error'}
              </CardTitle>
            </div>
            <Badge variant="destructive" className="text-xs">
              {isolationLevel.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className="border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{componentName || 'This section'}</strong> encountered an error and stopped working.
              {isComponentLevel && (
                <span className="block mt-1 text-sm text-muted-foreground">
                  Other parts of the application should continue to function normally.
                </span>
              )}
            </AlertDescription>
          </Alert>

          {error && (
            <div className="bg-red-100 border border-red-200 rounded p-3">
              <p className="text-sm font-medium text-red-800">Error Details:</p>
              <p className="text-sm text-red-700 mt-1">{error.message}</p>
              <p className="text-xs text-red-600 mt-1">Error ID: {errorId}</p>
            </div>
          )}

          {showErrorDetails && errorInfo && (
            <details className="bg-gray-100 border rounded p-3">
              <summary className="cursor-pointer text-sm font-medium">
                Technical Details (for developers)
              </summary>
              <pre className="text-xs mt-2 overflow-auto max-h-32 text-gray-700">
                {errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div className="flex flex-wrap gap-2">
            {canRetry && (
              <Button 
                onClick={this.handleRetry}
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again ({this.maxRetries - retryCount} left)
              </Button>
            )}
            
            {allowNavigation && !isComponentLevel && (
              <>
                <Button 
                  onClick={this.handleGoBack}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              </>
            )}
          </div>

          {retryCount >= this.maxRetries && (
            <Alert>
              <AlertDescription className="text-sm">
                This component has failed multiple times. Please refresh the page or contact support if the problem persists.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Render error UI
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WithErrorBoundaryComponent = (props: P) => (
    <ResilientErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ResilientErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithErrorBoundaryComponent;
};

// Specialized error boundaries for different parts of the app
export const ComponentErrorBoundary: React.FC<{ children: ReactNode; name: string }> = ({ children, name }) => (
  <ResilientErrorBoundary
    isolationLevel="component"
    componentName={name}
    allowRetry={true}
    allowNavigation={false}
    showErrorDetails={false}
  >
    {children}
  </ResilientErrorBoundary>
);

export const SectionErrorBoundary: React.FC<{ children: ReactNode; name: string }> = ({ children, name }) => (
  <ResilientErrorBoundary
    isolationLevel="section"
    componentName={name}
    allowRetry={true}
    allowNavigation={false}
    showErrorDetails={false}
  >
    {children}
  </ResilientErrorBoundary>
);

export const PageErrorBoundary: React.FC<{ children: ReactNode; name: string }> = ({ children, name }) => (
  <ResilientErrorBoundary
    isolationLevel="page"
    componentName={name}
    allowRetry={true}
    allowNavigation={true}
    showErrorDetails={true}
  >
    {children}
  </ResilientErrorBoundary>
);