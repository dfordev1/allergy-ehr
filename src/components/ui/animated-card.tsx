import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  animation?: 'slide-up' | 'fade-in' | 'scale' | 'bounce' | 'glow';
  delay?: number;
  hover?: boolean;
  gradient?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

const animationClasses = {
  'slide-up': 'animate-slide-up',
  'fade-in': 'animate-fade-in',
  'scale': 'animate-scale-in',
  'bounce': 'animate-bounce-in',
  'glow': 'animate-glow'
};

const priorityColors = {
  low: 'border-green-200 bg-green-50/50',
  normal: 'border-blue-200 bg-blue-50/50',
  high: 'border-orange-200 bg-orange-50/50',
  urgent: 'border-red-200 bg-red-50/50'
};

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  title,
  className,
  animation = 'fade-in',
  delay = 0,
  hover = true,
  gradient = false,
  priority
}) => {
  const cardClasses = cn(
    'transition-all duration-300 ease-in-out',
    animationClasses[animation],
    hover && 'hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]',
    gradient && 'bg-gradient-to-br from-white to-gray-50/50',
    priority && priorityColors[priority],
    className
  );

  const style = delay > 0 ? { animationDelay: `${delay}ms` } : undefined;

  return (
    <Card className={cardClasses} style={style}>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {priority === 'urgent' && (
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
            )}
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

// Animated Statistics Card
export const StatsCard: React.FC<{
  title: string;
  value: number;
  change?: number;
  icon?: React.ReactNode;
  color?: string;
  delay?: number;
}> = ({ title, value, change, icon, color = 'blue', delay = 0 }) => {
  return (
    <AnimatedCard 
      animation="slide-up" 
      delay={delay} 
      gradient 
      className={`border-${color}-200`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className={`text-2xl font-bold text-${color}-600`}>
              {value.toLocaleString()}
            </p>
            {change !== undefined && (
              <span className={cn(
                'text-sm font-medium',
                change >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {change >= 0 ? '+' : ''}{change}%
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div className={`p-2 rounded-full bg-${color}-100 text-${color}-600`}>
            {icon}
          </div>
        )}
      </div>
    </AnimatedCard>
  );
};

// Quick Action Card
export const QuickActionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}> = ({ title, description, icon, onClick, color = 'blue', disabled = false }) => {
  return (
    <AnimatedCard 
      hover={!disabled}
      className={cn(
        'cursor-pointer transition-all duration-200',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && `hover:border-${color}-300 hover:bg-${color}-50/30`
      )}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </AnimatedCard>
  );
};