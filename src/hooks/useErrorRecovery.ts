import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface ErrorRecoveryState {
  error: Error | null;
  isRecovering: boolean;
  retryCount: number;
  hasRecovered: boolean;
}

interface UseErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  onRecovery?: () => void;
  fallbackAction?: () => void;
}

export const useErrorRecovery = (options: UseErrorRecoveryOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onRecovery,
    fallbackAction
  } = options;

  const [state, setState] = useState<ErrorRecoveryState>({
    error: null,
    isRecovering: false,
    retryCount: 0,
    hasRecovered: false
  });

  const handleError = useCallback((error: Error) => {
    console.error('Error caught by recovery hook:', error);
    
    setState(prev => ({
      ...prev,
      error,
      hasRecovered: false
    }));

    if (onError) {
      onError(error);
    }

    // Show user-friendly error message
    toast.error('Something went wrong', {
      description: 'We\'re trying to recover automatically...'
    });
  }, [onError]);

  const retry = useCallback(async (recoveryFunction?: () => Promise<void> | void) => {
    if (state.retryCount >= maxRetries) {
      toast.error('Recovery failed after multiple attempts');
      if (fallbackAction) {
        fallbackAction();
      }
      return false;
    }

    setState(prev => ({
      ...prev,
      isRecovering: true,
      retryCount: prev.retryCount + 1
    }));

    try {
      // Wait for retry delay
      await new Promise(resolve => setTimeout(resolve, retryDelay * state.retryCount));

      // Execute recovery function if provided
      if (recoveryFunction) {
        await recoveryFunction();
      }

      // Mark as recovered
      setState(prev => ({
        ...prev,
        error: null,
        isRecovering: false,
        hasRecovered: true
      }));

      toast.success('Recovered successfully!');
      
      if (onRecovery) {
        onRecovery();
      }

      return true;
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      
      setState(prev => ({
        ...prev,
        isRecovering: false,
        error: recoveryError as Error
      }));

      return false;
    }
  }, [state.retryCount, maxRetries, retryDelay, onRecovery, fallbackAction]);

  const reset = useCallback(() => {
    setState({
      error: null,
      isRecovering: false,
      retryCount: 0,
      hasRecovered: false
    });
  }, []);

  const canRetry = state.retryCount < maxRetries;

  return {
    error: state.error,
    isRecovering: state.isRecovering,
    hasRecovered: state.hasRecovered,
    retryCount: state.retryCount,
    canRetry,
    handleError,
    retry,
    reset
  };
};

// Hook for API call error recovery
export const useApiErrorRecovery = () => {
  const [failedRequests, setFailedRequests] = useState<Map<string, number>>(new Map());

  const executeWithRecovery = useCallback(async <T>(
    requestKey: string,
    apiCall: () => Promise<T>,
    options: {
      maxRetries?: number;
      retryDelay?: number;
      showErrors?: boolean;
    } = {}
  ): Promise<T | null> => {
    const { maxRetries = 3, retryDelay = 1000, showErrors = true } = options;
    const currentRetries = failedRequests.get(requestKey) || 0;

    try {
      const result = await apiCall();
      
      // Clear retry count on success
      setFailedRequests(prev => {
        const newMap = new Map(prev);
        newMap.delete(requestKey);
        return newMap;
      });

      return result;
    } catch (error) {
      console.error(`API call failed for ${requestKey}:`, error);

      if (currentRetries < maxRetries) {
        // Increment retry count
        setFailedRequests(prev => {
          const newMap = new Map(prev);
          newMap.set(requestKey, currentRetries + 1);
          return newMap;
        });

        if (showErrors) {
          toast.error(`Request failed, retrying... (${currentRetries + 1}/${maxRetries})`);
        }

        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, retryDelay * (currentRetries + 1)));
        return executeWithRecovery(requestKey, apiCall, options);
      } else {
        // Max retries reached
        if (showErrors) {
          toast.error('Request failed after multiple attempts');
        }
        return null;
      }
    }
  }, [failedRequests]);

  const clearFailedRequest = useCallback((requestKey: string) => {
    setFailedRequests(prev => {
      const newMap = new Map(prev);
      newMap.delete(requestKey);
      return newMap;
    });
  }, []);

  const getRetryCount = useCallback((requestKey: string) => {
    return failedRequests.get(requestKey) || 0;
  }, [failedRequests]);

  return {
    executeWithRecovery,
    clearFailedRequest,
    getRetryCount,
    failedRequests: Object.fromEntries(failedRequests)
  };
};

// Hook for component state recovery
export const useStateRecovery = <T>(initialState: T) => {
  const [state, setState] = useState<T>(initialState);
  const [stateHistory, setStateHistory] = useState<T[]>([initialState]);
  const [hasError, setHasError] = useState(false);

  // Save state to history
  const saveState = useCallback((newState: T) => {
    setState(newState);
    setStateHistory(prev => [...prev.slice(-9), newState]); // Keep last 10 states
    setHasError(false);
  }, []);

  // Recover to previous state
  const recoverToPrevious = useCallback(() => {
    if (stateHistory.length > 1) {
      const previousState = stateHistory[stateHistory.length - 2];
      setState(previousState);
      setStateHistory(prev => prev.slice(0, -1));
      setHasError(false);
      toast.success('Recovered to previous state');
      return true;
    }
    return false;
  }, [stateHistory]);

  // Reset to initial state
  const resetToInitial = useCallback(() => {
    setState(initialState);
    setStateHistory([initialState]);
    setHasError(false);
    toast.info('Reset to initial state');
  }, [initialState]);

  // Mark state as corrupted
  const markAsCorrupted = useCallback(() => {
    setHasError(true);
    toast.warning('State corruption detected');
  }, []);

  return {
    state,
    setState: saveState,
    hasError,
    canRecoverToPrevious: stateHistory.length > 1,
    recoverToPrevious,
    resetToInitial,
    markAsCorrupted,
    stateHistory: stateHistory.length
  };
};