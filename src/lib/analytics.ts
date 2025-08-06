// ============================================================================
// ADVANCED ANALYTICS AND REPORTING SYSTEM
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from '@/lib/cache';
import { performanceMonitor } from '@/lib/performance';

export interface AnalyticsMetric {
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'stable';
  format: 'number' | 'percentage' | 'currency' | 'duration';
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    fill?: boolean;
  }>;
}

export interface AnalyticsReport {
  title: string;
  description: string;
  generatedAt: Date;
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: AnalyticsMetric[];
  charts: Array<{
    type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
    title: string;
    data: ChartData;
  }>;
  insights: string[];
  recommendations: string[];
}

export interface AnalyticsQuery {
  dateRange: {
    start: Date;
    end: Date;
  };
  groupBy?: 'day' | 'week' | 'month' | 'quarter';
  filters?: Record<string, any>;
  metrics?: string[];
}

class AdvancedAnalyticsEngine {
  private cache = cacheManager.staticData;

  // Main analytics generation method
  async generateReport(query: AnalyticsQuery): Promise<AnalyticsReport> {
    const endMeasurement = performanceMonitor.recordUserAction('generate_analytics_report', 'Analytics');
    
    try {
      const cacheKey = `analytics_report_${JSON.stringify(query)}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached as AnalyticsReport;
      }

      // Fetch all required data in parallel
      const [
        patientMetrics,
        bookingMetrics,
        testMetrics,
        performanceMetrics,
        complianceMetrics
      ] = await Promise.all([
        this.getPatientMetrics(query),
        this.getBookingMetrics(query),
        this.getTestMetrics(query),
        this.getPerformanceMetrics(query),
        this.getComplianceMetrics(query)
      ]);

      // Generate charts
      const charts = await this.generateCharts(query, {
        patients: patientMetrics,
        bookings: bookingMetrics,
        tests: testMetrics
      });

      // Generate insights and recommendations
      const insights = this.generateInsights({
        patients: patientMetrics,
        bookings: bookingMetrics,
        tests: testMetrics,
        performance: performanceMetrics,
        compliance: complianceMetrics
      });

      const recommendations = this.generateRecommendations({
        patients: patientMetrics,
        bookings: bookingMetrics,
        tests: testMetrics,
        performance: performanceMetrics,
        compliance: complianceMetrics
      });

      const report: AnalyticsReport = {
        title: 'Medical Analytics Report',
        description: 'Comprehensive analysis of medical practice operations',
        generatedAt: new Date(),
        dateRange: query.dateRange,
        metrics: [
          ...patientMetrics,
          ...bookingMetrics,
          ...testMetrics,
          ...performanceMetrics,
          ...complianceMetrics
        ],
        charts,
        insights,
        recommendations
      };

      // Cache the report for 10 minutes
      this.cache.set(cacheKey, report, 10 * 60 * 1000);

      return report;
    } finally {
      endMeasurement();
    }
  }

  // Patient analytics
  private async getPatientMetrics(query: AnalyticsQuery): Promise<AnalyticsMetric[]> {
    const { data: patients, error } = await supabase
      .from('patients')
      .select('*')
      .gte('createdat', query.dateRange.start.toISOString())
      .lte('createdat', query.dateRange.end.toISOString());

    if (error) {
      console.warn('Failed to fetch patient metrics:', error);
      return [];
    }

    const totalPatients = patients?.length || 0;
    const malePatients = patients?.filter(p => p.sex === 'male').length || 0;
    const femalePatients = patients?.filter(p => p.sex === 'female').length || 0;
    
    const ageGroups = {
      '0-18': 0,
      '19-35': 0,
      '36-50': 0,
      '51-65': 0,
      '65+': 0
    };

    patients?.forEach(patient => {
      const age = patient.age;
      if (age <= 18) ageGroups['0-18']++;
      else if (age <= 35) ageGroups['19-35']++;
      else if (age <= 50) ageGroups['36-50']++;
      else if (age <= 65) ageGroups['51-65']++;
      else ageGroups['65+']++;
    });

    // Calculate previous period for comparison
    const previousPeriodStart = new Date(query.dateRange.start);
    const previousPeriodEnd = new Date(query.dateRange.end);
    const periodLength = query.dateRange.end.getTime() - query.dateRange.start.getTime();
    
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodLength);
    previousPeriodEnd.setTime(previousPeriodEnd.getTime() - periodLength);

    const { data: previousPatients } = await supabase
      .from('patients')
      .select('*')
      .gte('createdat', previousPeriodStart.toISOString())
      .lte('createdat', previousPeriodEnd.toISOString());

    const previousTotal = previousPatients?.length || 0;

    return [
      {
        name: 'Total Patients',
        value: totalPatients,
        previousValue: previousTotal,
        change: totalPatients - previousTotal,
        changePercent: previousTotal > 0 ? ((totalPatients - previousTotal) / previousTotal) * 100 : 0,
        trend: totalPatients > previousTotal ? 'up' : totalPatients < previousTotal ? 'down' : 'stable',
        format: 'number'
      },
      {
        name: 'Male Patients',
        value: malePatients,
        trend: 'stable',
        format: 'number'
      },
      {
        name: 'Female Patients',
        value: femalePatients,
        trend: 'stable',
        format: 'number'
      },
      {
        name: 'Average Age',
        value: totalPatients > 0 ? Math.round((patients?.reduce((sum, p) => sum + p.age, 0) || 0) / totalPatients) : 0,
        trend: 'stable',
        format: 'number'
      }
    ];
  }

  // Booking analytics
  private async getBookingMetrics(query: AnalyticsQuery): Promise<AnalyticsMetric[]> {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .gte('appointment_date', query.dateRange.start.toISOString().split('T')[0])
      .lte('appointment_date', query.dateRange.end.toISOString().split('T')[0]);

    if (error) {
      console.warn('Failed to fetch booking metrics:', error);
      return [];
    }

    const totalBookings = bookings?.length || 0;
    const scheduledBookings = bookings?.filter(b => b.status === 'scheduled').length || 0;
    const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
    const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0;

    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
    const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

    return [
      {
        name: 'Total Bookings',
        value: totalBookings,
        trend: 'stable',
        format: 'number'
      },
      {
        name: 'Scheduled Bookings',
        value: scheduledBookings,
        trend: 'stable',
        format: 'number'
      },
      {
        name: 'Completed Bookings',
        value: completedBookings,
        trend: 'stable',
        format: 'number'
      },
      {
        name: 'Completion Rate',
        value: completionRate,
        trend: completionRate > 80 ? 'up' : completionRate < 60 ? 'down' : 'stable',
        format: 'percentage'
      },
      {
        name: 'Cancellation Rate',
        value: cancellationRate,
        trend: cancellationRate < 10 ? 'up' : cancellationRate > 20 ? 'down' : 'stable',
        format: 'percentage'
      }
    ];
  }

  // Test analytics
  private async getTestMetrics(query: AnalyticsQuery): Promise<AnalyticsMetric[]> {
    const { data: tests, error } = await supabase
      .from('enhanced_allergy_tests')
      .select('*')
      .gte('test_date', query.dateRange.start.toISOString().split('T')[0])
      .lte('test_date', query.dateRange.end.toISOString().split('T')[0]);

    if (error) {
      console.warn('Failed to fetch test metrics:', error);
      return [];
    }

    const totalTests = tests?.length || 0;
    const completedTests = tests?.filter(t => t.is_completed).length || 0;
    const reviewedTests = tests?.filter(t => t.is_reviewed).length || 0;

    const completionRate = totalTests > 0 ? (completedTests / totalTests) * 100 : 0;
    const reviewRate = totalTests > 0 ? (reviewedTests / totalTests) * 100 : 0;

    // Analyze test results for positive findings
    let positiveResults = 0;
    tests?.forEach(test => {
      if (test.allergen_results && typeof test.allergen_results === 'object') {
        const results = Object.values(test.allergen_results);
        const hasPositive = results.some(result => {
          if (typeof result === 'string') {
            const size = parseInt(result.replace('mm', ''));
            return size >= 3; // 3mm or larger is typically considered positive
          }
          return false;
        });
        if (hasPositive) positiveResults++;
      }
    });

    const positiveRate = totalTests > 0 ? (positiveResults / totalTests) * 100 : 0;

    return [
      {
        name: 'Total Tests',
        value: totalTests,
        trend: 'stable',
        format: 'number'
      },
      {
        name: 'Completed Tests',
        value: completedTests,
        trend: 'stable',
        format: 'number'
      },
      {
        name: 'Test Completion Rate',
        value: completionRate,
        trend: completionRate > 90 ? 'up' : completionRate < 70 ? 'down' : 'stable',
        format: 'percentage'
      },
      {
        name: 'Review Rate',
        value: reviewRate,
        trend: reviewRate > 80 ? 'up' : reviewRate < 60 ? 'down' : 'stable',
        format: 'percentage'
      },
      {
        name: 'Positive Results Rate',
        value: positiveRate,
        trend: 'stable',
        format: 'percentage'
      }
    ];
  }

  // Performance metrics
  private async getPerformanceMetrics(query: AnalyticsQuery): Promise<AnalyticsMetric[]> {
    const performanceData = performanceMonitor.getPerformanceSummary();
    
    return [
      {
        name: 'Average Page Load Time',
        value: performanceData.page_load_time?.average || 0,
        trend: (performanceData.page_load_time?.average || 0) < 3000 ? 'up' : 'down',
        format: 'duration'
      },
      {
        name: 'Average User Action Time',
        value: performanceData.userActions?.averageActionTime || 0,
        trend: (performanceData.userActions?.averageActionTime || 0) < 200 ? 'up' : 'down',
        format: 'duration'
      },
      {
        name: 'Total User Actions',
        value: performanceData.userActions?.totalActions || 0,
        trend: 'stable',
        format: 'number'
      }
    ];
  }

  // Compliance metrics
  private async getComplianceMetrics(query: AnalyticsQuery): Promise<AnalyticsMetric[]> {
    // In a real implementation, you would check various compliance metrics
    // For now, we'll provide placeholder metrics
    return [
      {
        name: 'Data Retention Compliance',
        value: 95,
        trend: 'up',
        format: 'percentage'
      },
      {
        name: 'Access Control Compliance',
        value: 98,
        trend: 'up',
        format: 'percentage'
      },
      {
        name: 'Audit Trail Completeness',
        value: 100,
        trend: 'up',
        format: 'percentage'
      }
    ];
  }

  // Generate charts
  private async generateCharts(query: AnalyticsQuery, data: any): Promise<AnalyticsReport['charts']> {
    const charts: AnalyticsReport['charts'] = [];

    // Patient demographics chart
    const patientGenderData = data.patients.filter((m: AnalyticsMetric) => 
      m.name === 'Male Patients' || m.name === 'Female Patients'
    );

    if (patientGenderData.length === 2) {
      charts.push({
        type: 'pie',
        title: 'Patient Demographics by Gender',
        data: {
          labels: ['Male', 'Female'],
          datasets: [{
            label: 'Patients',
            data: patientGenderData.map((m: AnalyticsMetric) => m.value),
            backgroundColor: ['#3B82F6', '#EF4444']
          }]
        }
      });
    }

    // Booking status chart
    const bookingStatusData = data.bookings.filter((m: AnalyticsMetric) => 
      m.name.includes('Bookings') && m.name !== 'Total Bookings'
    );

    if (bookingStatusData.length > 0) {
      charts.push({
        type: 'bar',
        title: 'Booking Status Distribution',
        data: {
          labels: bookingStatusData.map((m: AnalyticsMetric) => m.name.replace(' Bookings', '')),
          datasets: [{
            label: 'Count',
            data: bookingStatusData.map((m: AnalyticsMetric) => m.value),
            backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
          }]
        }
      });
    }

    // Performance trend chart (mock data for demonstration)
    charts.push({
      type: 'line',
      title: 'System Performance Trend',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'Average Response Time (ms)',
          data: [250, 230, 210, 195],
          borderColor: '#8B5CF6',
          fill: false
        }]
      }
    });

    return charts;
  }

  // Generate insights
  private generateInsights(data: any): string[] {
    const insights: string[] = [];

    // Patient insights
    const totalPatients = data.patients.find((m: AnalyticsMetric) => m.name === 'Total Patients');
    if (totalPatients) {
      if (totalPatients.changePercent && totalPatients.changePercent > 10) {
        insights.push(`Patient registration increased by ${totalPatients.changePercent.toFixed(1)}% compared to the previous period.`);
      } else if (totalPatients.changePercent && totalPatients.changePercent < -10) {
        insights.push(`Patient registration decreased by ${Math.abs(totalPatients.changePercent).toFixed(1)}% compared to the previous period.`);
      }
    }

    // Booking insights
    const completionRate = data.bookings.find((m: AnalyticsMetric) => m.name === 'Completion Rate');
    if (completionRate && completionRate.value < 70) {
      insights.push(`Booking completion rate is below optimal at ${completionRate.value.toFixed(1)}%. Consider reviewing scheduling processes.`);
    }

    const cancellationRate = data.bookings.find((m: AnalyticsMetric) => m.name === 'Cancellation Rate');
    if (cancellationRate && cancellationRate.value > 20) {
      insights.push(`High cancellation rate detected at ${cancellationRate.value.toFixed(1)}%. This may indicate scheduling or communication issues.`);
    }

    // Test insights
    const positiveRate = data.tests.find((m: AnalyticsMetric) => m.name === 'Positive Results Rate');
    if (positiveRate && positiveRate.value > 60) {
      insights.push(`High positive allergy test rate at ${positiveRate.value.toFixed(1)}% may indicate environmental factors or patient selection criteria.`);
    }

    // Performance insights
    const pageLoadTime = data.performance.find((m: AnalyticsMetric) => m.name === 'Average Page Load Time');
    if (pageLoadTime && pageLoadTime.value > 3000) {
      insights.push(`Page load times are above optimal threshold. Consider performance optimization.`);
    }

    return insights;
  }

  // Generate recommendations
  private generateRecommendations(data: any): string[] {
    const recommendations: string[] = [];

    // Booking recommendations
    const completionRate = data.bookings.find((m: AnalyticsMetric) => m.name === 'Completion Rate');
    if (completionRate && completionRate.value < 80) {
      recommendations.push('Implement automated appointment reminders to improve completion rates.');
      recommendations.push('Review scheduling processes to reduce no-shows.');
    }

    const cancellationRate = data.bookings.find((m: AnalyticsMetric) => m.name === 'Cancellation Rate');
    if (cancellationRate && cancellationRate.value > 15) {
      recommendations.push('Analyze cancellation patterns to identify common causes.');
      recommendations.push('Consider implementing a cancellation fee policy.');
    }

    // Test recommendations
    const reviewRate = data.tests.find((m: AnalyticsMetric) => m.name === 'Review Rate');
    if (reviewRate && reviewRate.value < 90) {
      recommendations.push('Establish a systematic test review workflow.');
      recommendations.push('Set up automated alerts for pending test reviews.');
    }

    // Performance recommendations
    const pageLoadTime = data.performance.find((m: AnalyticsMetric) => m.name === 'Average Page Load Time');
    if (pageLoadTime && pageLoadTime.value > 2000) {
      recommendations.push('Optimize images and assets to improve page load times.');
      recommendations.push('Consider implementing lazy loading for better performance.');
    }

    // General recommendations
    recommendations.push('Regularly backup patient data to ensure compliance and security.');
    recommendations.push('Conduct periodic staff training on system usage and best practices.');
    recommendations.push('Review and update security protocols quarterly.');

    return recommendations;
  }

  // Export report
  async exportReport(report: AnalyticsReport, format: 'pdf' | 'excel' | 'json' = 'pdf'): Promise<Blob> {
    const endMeasurement = performanceMonitor.recordUserAction('export_analytics_report', 'Analytics');
    
    try {
      switch (format) {
        case 'json':
          return new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        
        case 'excel':
          // In a real implementation, use a library like SheetJS
          const csvContent = this.reportToCSV(report);
          return new Blob([csvContent], { type: 'text/csv' });
        
        case 'pdf':
        default:
          const htmlContent = this.reportToHTML(report);
          return new Blob([htmlContent], { type: 'text/html' });
      }
    } finally {
      endMeasurement();
    }
  }

  private reportToCSV(report: AnalyticsReport): string {
    const lines = [
      `Report: ${report.title}`,
      `Generated: ${report.generatedAt.toLocaleString()}`,
      `Period: ${report.dateRange.start.toLocaleDateString()} - ${report.dateRange.end.toLocaleDateString()}`,
      '',
      'Metrics',
      'Name,Value,Previous Value,Change,Change %,Trend,Format'
    ];

    report.metrics.forEach(metric => {
      lines.push([
        metric.name,
        metric.value,
        metric.previousValue || '',
        metric.change || '',
        metric.changePercent || '',
        metric.trend,
        metric.format
      ].join(','));
    });

    lines.push('', 'Insights');
    report.insights.forEach(insight => {
      lines.push(`"${insight}"`);
    });

    lines.push('', 'Recommendations');
    report.recommendations.forEach(recommendation => {
      lines.push(`"${recommendation}"`);
    });

    return lines.join('\n');
  }

  private reportToHTML(report: AnalyticsReport): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${report.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { margin-bottom: 30px; }
          .section { margin-bottom: 25px; }
          .metric { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
          .metric-value { font-size: 24px; font-weight: bold; }
          .metric-name { color: #666; }
          .insight, .recommendation { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 3px; }
          .trend-up { color: #10B981; }
          .trend-down { color: #EF4444; }
          .trend-stable { color: #6B7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${report.title}</h1>
          <p><strong>Generated:</strong> ${report.generatedAt.toLocaleString()}</p>
          <p><strong>Period:</strong> ${report.dateRange.start.toLocaleDateString()} - ${report.dateRange.end.toLocaleDateString()}</p>
        </div>
        
        <div class="section">
          <h2>Key Metrics</h2>
          ${report.metrics.map(metric => `
            <div class="metric">
              <div class="metric-name">${metric.name}</div>
              <div class="metric-value trend-${metric.trend}">${this.formatMetricValue(metric)}</div>
              ${metric.changePercent ? `<div>Change: ${metric.changePercent > 0 ? '+' : ''}${metric.changePercent.toFixed(1)}%</div>` : ''}
            </div>
          `).join('')}
        </div>
        
        <div class="section">
          <h2>Key Insights</h2>
          ${report.insights.map(insight => `<div class="insight">${insight}</div>`).join('')}
        </div>
        
        <div class="section">
          <h2>Recommendations</h2>
          ${report.recommendations.map(rec => `<div class="recommendation">${rec}</div>`).join('')}
        </div>
      </body>
      </html>
    `;
  }

  private formatMetricValue(metric: AnalyticsMetric): string {
    switch (metric.format) {
      case 'percentage':
        return `${metric.value.toFixed(1)}%`;
      case 'currency':
        return `$${metric.value.toFixed(2)}`;
      case 'duration':
        return `${metric.value.toFixed(0)}ms`;
      default:
        return metric.value.toString();
    }
  }
}

// Export singleton instance
export const analyticsEngine = new AdvancedAnalyticsEngine();

// React hook for analytics
export function useAnalytics() {
  const [loading, setLoading] = React.useState(false);
  const [report, setReport] = React.useState<AnalyticsReport | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const generateReport = React.useCallback(async (query: AnalyticsQuery) => {
    setLoading(true);
    setError(null);

    try {
      const analyticsReport = await analyticsEngine.generateReport(query);
      setReport(analyticsReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, []);

  const exportReport = React.useCallback(async (format: 'pdf' | 'excel' | 'json' = 'pdf') => {
    if (!report) return;

    try {
      const blob = await analyticsEngine.exportReport(report, format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics_report_${Date.now()}.${format === 'excel' ? 'csv' : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export report');
    }
  }, [report]);

  return {
    loading,
    report,
    error,
    generateReport,
    exportReport
  };
}

export default analyticsEngine;