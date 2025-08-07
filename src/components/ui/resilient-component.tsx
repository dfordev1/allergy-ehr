import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ComponentErrorBoundary } from '@/components/errors/ResilientErrorBoundary';
import { useErrorRecovery } from '@/hooks/useErrorRecovery';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ResilientComponentProps {
  children: React.ReactNode;
  name: string;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
  retryable?: boolean;
  loadingFallback?: React.ReactNode;
}

// HOC to make any component resilient
export const withResilience = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    name: string;
    retryable?: boolean;
    fallback?: React.ReactNode;
  }
) => {
  const ResilientWrappedComponent = (props: P) => {
    const { error, isRecovering, retry, handleError, canRetry } = useErrorRecovery({
      maxRetries: 3,
      retryDelay: 1000
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleRetry = useCallback(async () => {
      setIsLoading(true);
      try {
        await retry();
      } finally {
        setIsLoading(false);
      }
    }, [retry]);

    if (error && !isRecovering) {
      return (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{options.name}</strong> encountered an error but the rest of the app is working fine.
              </AlertDescription>
            </Alert>
            
            {canRetry && options.retryable !== false && (
              <Button 
                onClick={handleRetry} 
                size="sm" 
                className="mt-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Retrying...</>
                ) : (
                  <><RefreshCw className="h-4 w-4 mr-2" /> Try Again</>
                )}
              </Button>
            )}
            
            {options.fallback && (
              <div className="mt-3 p-3 bg-white rounded border">
                {options.fallback}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <ComponentErrorBoundary name={options.name}>
        <WrappedComponent {...props} />
      </ComponentErrorBoundary>
    );
  };

  ResilientWrappedComponent.displayName = `withResilience(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return ResilientWrappedComponent;
};

// Resilient async component wrapper
export const ResilientAsyncComponent: React.FC<{
  children: React.ReactNode;
  name: string;
  asyncOperation?: () => Promise<void>;
  dependencies?: unknown[];
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}> = ({ 
  children, 
  name, 
  asyncOperation, 
  dependencies = [], 
  fallback,
  loadingComponent 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const { error, isRecovering, retry, handleError, canRetry } = useErrorRecovery({
    maxRetries: 3,
    onError: (error) => {
      console.error(`Error in ${name}:`, error);
      toast.error(`${name} encountered an error`, {
        description: 'Other parts of the app continue to work normally.'
      });
    }
  });

  const executeAsyncOperation = useCallback(async () => {
    if (!asyncOperation) {
      setHasInitialized(true);
      return;
    }

    setIsLoading(true);
    try {
      await asyncOperation();
      setHasInitialized(true);
    } catch (error) {
      handleError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [asyncOperation, handleError]);

  useEffect(() => {
    executeAsyncOperation();
  }, dependencies);

  const handleRetry = useCallback(async () => {
    await retry(executeAsyncOperation);
  }, [retry, executeAsyncOperation]);

  if (isLoading || isRecovering) {
    return loadingComponent || (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Loading {name}...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error && !hasInitialized) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{name}</strong> failed to load, but other parts of the app are working.
            </AlertDescription>
          </Alert>
          
          {canRetry && (
            <Button onClick={handleRetry} size="sm" className="mt-3">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          
          {fallback && (
            <div className="mt-3 p-3 bg-white rounded border">
              {fallback}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <ComponentErrorBoundary name={name}>
      {children}
    </ComponentErrorBoundary>
  );
};

// Resilient list component that isolates item errors
export const ResilientList: React.FC<{
  items: unknown[];
  renderItem: (item: unknown, index: number) => React.ReactNode;
  keyExtractor: (item: unknown, index: number) => string;
  name: string;
  emptyComponent?: React.ReactNode;
  errorItemComponent?: (error: Error, item: unknown, retry: () => void) => React.ReactNode;
}> = ({ 
  items, 
  renderItem, 
  keyExtractor, 
  name, 
  emptyComponent,
  errorItemComponent 
}) => {
  const [failedItems, setFailedItems] = useState<Set<string>>(new Set());

  const handleItemError = useCallback((itemKey: string, error: Error) => {
    console.error(`Error in ${name} item ${itemKey}:`, error);
    setFailedItems(prev => new Set([...prev, itemKey]));
    
    toast.error(`Item in ${name} failed to render`, {
      description: 'Other items continue to work normally.'
    });
  }, [name]);

  const retryItem = useCallback((itemKey: string) => {
    setFailedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemKey);
      return newSet;
    });
  }, []);

  if (items.length === 0) {
    return (
      <div>
        {emptyComponent || (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No items to display</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const itemKey = keyExtractor(item, index);
        const hasFailed = failedItems.has(itemKey);

        if (hasFailed) {
          const error = new Error(`Failed to render item ${itemKey}`);
          return (
            <div key={itemKey}>
              {errorItemComponent ? (
                errorItemComponent(error, item, () => retryItem(itemKey))
              ) : (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="text-sm">Item failed to load</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => retryItem(itemKey)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        }

        return (
          <ComponentErrorBoundary 
            key={itemKey} 
            name={`${name} Item ${itemKey}`}
          >
            <ResilientItemWrapper
              onError={(error) => handleItemError(itemKey, error)}
            >
              {renderItem(item, index)}
            </ResilientItemWrapper>
          </ComponentErrorBoundary>
        );
      })}
    </div>
  );
};

// Internal wrapper to catch render errors in list items
const ResilientItemWrapper: React.FC<{
  children: React.ReactNode;
  onError: (error: Error) => void;
}> = ({ children, onError }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      setHasError(true);
      onError(new Error(error.message));
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [onError]);

  if (hasError) {
    return null; // Let parent handle the error display
  }

  return <>{children}</>;
};