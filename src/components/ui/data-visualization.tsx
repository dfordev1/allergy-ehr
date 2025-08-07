import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  Calendar, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
  trend?: number;
  status?: 'success' | 'warning' | 'error' | 'info';
}

interface VisualizationProps {
  title?: string;
  data: DataPoint[];
  type?: 'bar' | 'donut' | 'line' | 'metric' | 'heatmap';
  className?: string;
  animated?: boolean;
  showTrends?: boolean;
  height?: number;
}

// Mini Bar Chart Component
export const MiniBarChart: React.FC<VisualizationProps> = ({
  title,
  data,
  className,
  animated = true,
  showTrends = true
}) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <Card className={cn('p-4', className)}>
      {title && <CardTitle className="text-sm font-medium mb-3">{title}</CardTitle>}
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{item.label}</span>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">{item.value}</span>
                {showTrends && item.trend !== undefined && (
                  <div className={cn(
                    'flex items-center text-xs',
                    item.trend > 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {item.trend > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(item.trend)}%
                  </div>
                )}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-1000 ease-out',
                  item.color || 'bg-blue-600'
                )}
                style={{ 
                  width: animated ? `${(item.value / maxValue) * 100}%` : '0%',
                  animationDelay: `${index * 100}ms`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Donut Chart Component (CSS-based)
export const DonutChart: React.FC<VisualizationProps> = ({
  title,
  data,
  className
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate percentages and create segments
  let cumulativePercent = 0;
  const segments = data.map((item, index) => {
    const percent = (item.value / total) * 100;
    const segment = {
      ...item,
      percent,
      startAngle: cumulativePercent * 3.6, // Convert to degrees
      endAngle: (cumulativePercent + percent) * 3.6
    };
    cumulativePercent += percent;
    return segment;
  });

  return (
    <Card className={cn('p-4', className)}>
      {title && <CardTitle className="text-sm font-medium mb-3">{title}</CardTitle>}
      <div className="flex items-center space-x-4">
        {/* CSS Donut Chart */}
        <div className="relative w-24 h-24">
          <div className="w-full h-full rounded-full border-8 border-gray-200 relative overflow-hidden">
            {segments.map((segment, index) => (
              <div
                key={index}
                className="absolute inset-0 rounded-full border-8 border-transparent"
                style={{
                  borderTopColor: segment.color || `hsl(${index * 60}, 70%, 50%)`,
                  transform: `rotate(${segment.startAngle}deg)`,
                  clipPath: `polygon(50% 50%, 50% 0%, ${
                    segment.percent > 50 ? '100% 0%, 100% 100%, ' : ''
                  }${
                    50 + 50 * Math.cos((segment.endAngle - 90) * Math.PI / 180)
                  }% ${
                    50 + 50 * Math.sin((segment.endAngle - 90) * Math.PI / 180)
                  }%)`
                }}
              />
            ))}
          </div>
          <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
            <span className="text-sm font-bold">{total}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 flex-1">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color || `hsl(${index * 60}, 70%, 50%)` }}
                />
                <span>{segment.label}</span>
              </div>
              <div className="text-right">
                <div className="font-medium">{segment.value}</div>
                <div className="text-xs text-muted-foreground">
                  {segment.percent.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// Metric Cards with Status Indicators
export const MetricCard: React.FC<{
  title: string;
  value: number | string;
  change?: number;
  status?: 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}> = ({ title, value, change, status, icon, description, className }) => {
  const statusColors = {
    success: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    error: 'text-red-600 bg-red-100',
    info: 'text-blue-600 bg-blue-100'
  };

  const StatusIcon = {
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
    info: Activity
  };

  return (
    <Card className={cn('p-4', className)}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold">{value}</p>
              {change !== undefined && (
                <div className={cn(
                  'flex items-center text-sm font-medium',
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {change >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(change)}%
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            {icon && (
              <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                {icon}
              </div>
            )}
            {status && (
              <Badge variant="secondary" className={statusColors[status]}>
                {React.createElement(StatusIcon[status], { className: 'h-3 w-3 mr-1' })}
                {status}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Heatmap Calendar (simplified)
export const HeatmapCalendar: React.FC<{
  title?: string;
  data: Array<{ date: string; value: number; status?: string }>;
  className?: string;
}> = ({ title, data, className }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  // Group data by week
  const weeks = useMemo(() => {
    const grouped: Array<Array<{ date: string; value: number; status?: string }>> = [];
    let currentWeek: Array<{ date: string; value: number; status?: string }> = [];
    
    data.forEach((item, index) => {
      currentWeek.push(item);
      if ((index + 1) % 7 === 0 || index === data.length - 1) {
        grouped.push([...currentWeek]);
        currentWeek = [];
      }
    });
    
    return grouped;
  }, [data]);

  const getIntensity = (value: number) => {
    const intensity = Math.ceil((value / maxValue) * 4);
    return intensity;
  };

  const intensityColors = [
    'bg-gray-100',
    'bg-blue-200',
    'bg-blue-400',
    'bg-blue-600',
    'bg-blue-800'
  ];

  return (
    <Card className={cn('p-4', className)}>
      {title && <CardTitle className="text-sm font-medium mb-3">{title}</CardTitle>}
      <div className="space-y-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex space-x-1">
            {week.map((day, dayIndex) => {
              const intensity = getIntensity(day.value);
              return (
                <div
                  key={dayIndex}
                  className={cn(
                    'w-3 h-3 rounded-sm cursor-pointer transition-all hover:scale-125',
                    intensityColors[intensity]
                  )}
                  title={`${day.date}: ${day.value} appointments`}
                />
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex space-x-1">
          {intensityColors.map((color, index) => (
            <div key={index} className={cn('w-2 h-2 rounded-sm', color)} />
          ))}
        </div>
        <span>More</span>
      </div>
    </Card>
  );
};

// Quick Stats Grid
export const QuickStatsGrid: React.FC<{
  stats: Array<{
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    trend?: number;
  }>;
  className?: string;
}> = ({ stats, className }) => {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {stats.map((stat, index) => (
        <MetricCard
          key={index}
          title={stat.label}
          value={stat.value}
          change={stat.trend}
          icon={stat.icon}
          className={`border-l-4 border-${stat.color}-500`}
        />
      ))}
    </div>
  );
};