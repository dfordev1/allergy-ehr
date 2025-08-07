import React from 'react';
import { Loader2, Heart, Activity, Stethoscope, Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartLoadingProps {
  type?: 'default' | 'medical' | 'booking' | 'analytics' | 'patients';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const loadingConfigs = {
  default: {
    icon: Loader2,
    messages: ['Loading...', 'Please wait...', 'Getting ready...'],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  medical: {
    icon: Stethoscope,
    messages: ['Accessing medical records...', 'Reviewing patient data...', 'Loading clinical information...'],
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  booking: {
    icon: Calendar,
    messages: ['Loading appointments...', 'Checking availability...', 'Preparing booking system...'],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  analytics: {
    icon: Activity,
    messages: ['Analyzing data...', 'Generating insights...', 'Processing statistics...'],
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  patients: {
    icon: Users,
    messages: ['Loading patient records...', 'Accessing profiles...', 'Retrieving information...'],
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  }
};

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
};

export const SmartLoading: React.FC<SmartLoadingProps> = ({
  type = 'default',
  message,
  size = 'md',
  className
}) => {
  const config = loadingConfigs[type];
  const Icon = config.icon;
  const randomMessage = message || config.messages[Math.floor(Math.random() * config.messages.length)];

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 space-y-4', config.bgColor, className)}>
      <div className={cn('relative', sizeClasses[size])}>
        <Icon className={cn('animate-spin', config.color, sizeClasses[size])} />
        {type === 'medical' && (
          <Heart className="absolute -top-1 -right-1 h-3 w-3 text-red-500 animate-pulse" />
        )}
      </div>
      <div className="text-center">
        <p className={cn('font-medium', config.color)}>{randomMessage}</p>
        <div className="flex space-x-1 mt-2 justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn('h-2 w-2 rounded-full animate-pulse', config.color.replace('text-', 'bg-'))}
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Enhanced loading hook for different contexts
export const useSmartLoading = (type: SmartLoadingProps['type'] = 'default') => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | undefined>();

  const startLoading = (customMessage?: string) => {
    setMessage(customMessage);
    setIsLoading(true);
  };

  const stopLoading = () => {
    setIsLoading(false);
    setMessage(undefined);
  };

  const LoadingComponent = React.useMemo(() => 
    isLoading ? <SmartLoading type={type} message={message} /> : null, 
    [isLoading, type, message]
  );

  return {
    isLoading,
    startLoading,
    stopLoading,
    LoadingComponent
  };
};