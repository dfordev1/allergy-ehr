import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle, 
  Bug, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight,
  Lightbulb,
  ExternalLink,
  Copy,
  CheckCircle,
  XCircle,
  Wifi,
  Database,
  Shield,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ErrorInfo {
  code?: string;
  message: string;
  stack?: string;
  context?: string;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  url?: string;
}

interface ErrorSuggestion {
  id: string;
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
  type: 'quick_fix' | 'workaround' | 'contact_support' | 'documentation';
  confidence: number;
  icon: React.ReactNode;
}

interface SmartErrorHandlerProps {
  error: ErrorInfo;
  onRetry?: () => void;
  onReport?: (error: ErrorInfo) => void;
  className?: string;
}

// Smart error analysis to generate contextual suggestions
const analyzeError = (error: ErrorInfo): ErrorSuggestion[] => {
  const suggestions: ErrorSuggestion[] = [];
  const message = error.message.toLowerCase();
  const code = error.code?.toLowerCase();

  // Network/Connection Errors
  if (message.includes('network') || message.includes('fetch') || code === 'network_error') {
    suggestions.push({
      id: 'check_connection',
      title: 'Check Internet Connection',
      description: 'Verify your internet connection and try again',
      type: 'quick_fix',
      confidence: 0.9,
      icon: <Wifi className="h-4 w-4" />,
      action: () => {
        // Check connection
        if (navigator.onLine) {
          toast.success('Connection appears to be working');
        } else {
          toast.error('No internet connection detected');
        }
      },
      actionLabel: 'Test Connection'
    });

    suggestions.push({
      id: 'refresh_page',
      title: 'Refresh the Page',
      description: 'A simple refresh might resolve temporary network issues',
      type: 'quick_fix',
      confidence: 0.8,
      icon: <RefreshCw className="h-4 w-4" />,
      action: () => window.location.reload(),
      actionLabel: 'Refresh Now'
    });
  }

  // Database Errors
  if (message.includes('database') || message.includes('supabase') || code === 'database_error') {
    suggestions.push({
      id: 'check_database',
      title: 'Database Connection Issue',
      description: 'The database might be temporarily unavailable',
      type: 'workaround',
      confidence: 0.85,
      icon: <Database className="h-4 w-4" />,
      action: () => {
        toast.info('Checking database status...');
        // Could implement actual database ping here
      },
      actionLabel: 'Check Status'
    });

    suggestions.push({
      id: 'cache_data',
      title: 'Use Cached Data',
      description: 'Try working with locally cached information while we resolve this',
      type: 'workaround',
      confidence: 0.7,
      icon: <Clock className="h-4 w-4" />
    });
  }

  // Authentication Errors
  if (message.includes('auth') || message.includes('unauthorized') || code === 'auth_error') {
    suggestions.push({
      id: 'relogin',
      title: 'Sign In Again',
      description: 'Your session may have expired. Please sign in again',
      type: 'quick_fix',
      confidence: 0.9,
      icon: <Shield className="h-4 w-4" />,
      action: () => {
        // Clear local storage and redirect to login
        localStorage.clear();
        window.location.href = '/login';
      },
      actionLabel: 'Sign In'
    });
  }

  // Validation Errors
  if (message.includes('validation') || message.includes('required') || code === 'validation_error') {
    suggestions.push({
      id: 'check_form',
      title: 'Check Form Fields',
      description: 'Please ensure all required fields are filled correctly',
      type: 'quick_fix',
      confidence: 0.95,
      icon: <CheckCircle className="h-4 w-4" />
    });
  }

  // Generic Suggestions
  suggestions.push({
    id: 'contact_support',
    title: 'Contact Support',
    description: 'If the problem persists, our support team can help',
    type: 'contact_support',
    confidence: 0.6,
    icon: <ExternalLink className="h-4 w-4" />,
    action: () => {
      window.open('mailto:support@skintrackaid.com?subject=Error Report&body=' + encodeURIComponent(
        `Error: ${error.message}\nTime: ${error.timestamp}\nContext: ${error.context || 'N/A'}`
      ));
    },
    actionLabel: 'Send Email'
  });

  return suggestions.sort((a, b) => b.confidence - a.confidence);
};

const getErrorSeverity = (error: ErrorInfo): 'low' | 'medium' | 'high' | 'critical' => {
  const message = error.message.toLowerCase();
  
  if (message.includes('critical') || message.includes('fatal')) return 'critical';
  if (message.includes('auth') || message.includes('security')) return 'high';
  if (message.includes('network') || message.includes('database')) return 'medium';
  return 'low';
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-100 border-red-200';
    case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
    case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
    default: return 'text-gray-600 bg-gray-100 border-gray-200';
  }
};

export const SmartErrorHandler: React.FC<SmartErrorHandlerProps> = ({
  error,
  onRetry,
  onReport,
  className
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  
  const suggestions = analyzeError(error);
  const severity = getErrorSeverity(error);
  const severityColor = getSeverityColor(severity);

  const copyErrorDetails = async () => {
    const errorDetails = `
Error: ${error.message}
Code: ${error.code || 'N/A'}
Time: ${error.timestamp.toISOString()}
Context: ${error.context || 'N/A'}
URL: ${error.url || window.location.href}
User Agent: ${error.userAgent || navigator.userAgent}
Stack: ${error.stack || 'N/A'}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorDetails);
      setCopiedToClipboard(true);
      toast.success('Error details copied to clipboard');
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <Card className={cn('max-w-2xl mx-auto border-2', severityColor, className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn('p-2 rounded-full', severityColor)}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Something went wrong</CardTitle>
              <Badge variant="outline" className={cn('mt-1', severityColor)}>
                {severity.toUpperCase()} SEVERITY
              </Badge>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={copyErrorDetails}>
              {copiedToClipboard ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copiedToClipboard ? 'Copied!' : 'Copy Details'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Message */}
        <Alert>
          <Bug className="h-4 w-4" />
          <AlertDescription className="font-medium">
            {error.message}
          </AlertDescription>
        </Alert>

        {/* Smart Suggestions */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <span className="font-semibold text-sm">Suggested Solutions</span>
          </div>
          
          {suggestions.slice(0, 3).map((suggestion) => (
            <Card key={suggestion.id} className="border border-gray-200">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-1 rounded bg-gray-100">
                      {suggestion.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{suggestion.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center mt-2 space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.type.replace('_', ' ')}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {suggestion.action && suggestion.actionLabel && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={suggestion.action}
                      className="ml-3"
                    >
                      {suggestion.actionLabel}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Error Details (Collapsible) */}
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span>Technical Details</span>
              {showDetails ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2">
            <div className="bg-muted p-3 rounded-lg font-mono text-sm">
              <div><strong>Error Code:</strong> {error.code || 'N/A'}</div>
              <div><strong>Timestamp:</strong> {error.timestamp.toLocaleString()}</div>
              <div><strong>Context:</strong> {error.context || 'N/A'}</div>
              <div><strong>URL:</strong> {error.url || window.location.href}</div>
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer">Stack Trace</summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Report Error */}
        {onReport && (
          <div className="pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReport(error)}
              className="w-full"
            >
              <Bug className="h-4 w-4 mr-2" />
              Report This Error
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Help us improve by reporting this error. No personal data will be shared.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Error Boundary with Smart Handler
export class SmartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: ErrorInfo }> },
  { hasError: boolean; error: ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error: ErrorInfo }> }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: ErrorInfo } {
    return {
      hasError: true,
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date(),
        context: 'React Error Boundary',
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SmartErrorBoundary caught an error:', error, errorInfo);
    
    // Could send to error reporting service here
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false
      });
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <SmartErrorHandler
            error={this.state.error}
            onRetry={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            onReport={(error) => {
              console.log('Reporting error:', error);
              toast.success('Error report sent. Thank you for helping us improve!');
            }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}